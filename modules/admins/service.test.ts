import { describe, expect, it } from "vitest";
import type { AdminDirectory, UserAccount } from "@/modules/admins/directory";
import { inviteAdmin, removeAdmin, toAdminList } from "@/modules/admins/service";

const REDIRECT = "https://frangometro.vercel.app/auth/definir-senha";

function account(id: string, email: string, options: Partial<UserAccount> = {}): UserAccount {
  return { id, email, isAdmin: false, invitedAt: null, lastSignInAt: null, ...options };
}

/** Diretório de contas em memória com a mesma interface do Supabase Auth. */
function memoryDirectory(accounts: UserAccount[], options: { failOn?: keyof AdminDirectory } = {}) {
  const users = [...accounts];
  const sentInvites: { email: string; redirectTo: string }[] = [];
  const failIf = (method: keyof AdminDirectory) => {
    if (options.failOn === method) throw new Error(`Auth fora do ar (${method})`);
  };
  const directory: AdminDirectory = {
    async listUsers() {
      failIf("listUsers");
      return users.map((user) => ({ ...user }));
    },
    async invite(email, redirectTo) {
      failIf("invite");
      if (users.some((user) => user.email === email)) return { alreadyRegistered: true };
      sentInvites.push({ email, redirectTo });
      users.push(account(`user-${users.length + 1}`, email, { invitedAt: "2026-11-03T00:00:00Z" }));
      return { userId: `user-${users.length}` };
    },
    async grantAdmin(userId) {
      failIf("grantAdmin");
      const user = users.find((candidate) => candidate.id === userId);
      if (user) user.isAdmin = true;
    },
    async deleteUser(userId) {
      failIf("deleteUser");
      users.splice(users.findIndex((user) => user.id === userId), 1);
    },
  };
  const adminEmails = () => users.filter((user) => user.isAdmin).map((user) => user.email);
  return { directory, users, sentInvites, adminEmails };
}

const OWNER = account("owner", "sabino@exemplo.com", { isAdmin: true, lastSignInAt: "2026-11-02T10:00:00Z" });

describe("inviteAdmin", () => {
  it("convida o e-mail novo, já como admin, com link para definir a senha", async () => {
    const memory = memoryDirectory([OWNER]);

    const result = await inviteAdmin({ email: "  Nova@Exemplo.com ", redirectTo: REDIRECT, directory: memory.directory });

    expect(result).toEqual({ ok: true, message: "Convite enviado para nova@exemplo.com. O link vale por 24 horas." });
    expect(memory.sentInvites).toEqual([{ email: "nova@exemplo.com", redirectTo: REDIRECT }]);
    expect(memory.adminEmails()).toEqual(["sabino@exemplo.com", "nova@exemplo.com"]);
  });

  it("recusa e-mail inválido sem chamar o Supabase", async () => {
    const memory = memoryDirectory([OWNER], { failOn: "invite" });

    const result = await inviteAdmin({ email: "nova@exemplo", redirectTo: REDIRECT, directory: memory.directory });

    expect(result).toEqual({ ok: false, error: "Informe um e-mail válido." });
  });

  it("quem já tem conta não recebe convite: só vira admin", async () => {
    const memory = memoryDirectory([OWNER, account("antigo", "antigo@exemplo.com")]);

    const result = await inviteAdmin({ email: "antigo@exemplo.com", redirectTo: REDIRECT, directory: memory.directory });

    expect(result).toEqual({ ok: true, message: "antigo@exemplo.com já tinha conta e agora é admin. Peça para entrar em /admin/login." });
    expect(memory.sentInvites).toEqual([]);
    expect(memory.adminEmails()).toContain("antigo@exemplo.com");
  });

  it("avisa quando a pessoa já é admin", async () => {
    const memory = memoryDirectory([OWNER]);
    const result = await inviteAdmin({ email: "sabino@exemplo.com", redirectTo: REDIRECT, directory: memory.directory });
    expect(result).toEqual({ ok: false, error: "sabino@exemplo.com já é admin." });
  });

  it("explica em que etapa falhou", async () => {
    const inviteDown = memoryDirectory([OWNER], { failOn: "invite" });
    expect(await inviteAdmin({ email: "nova@exemplo.com", redirectTo: REDIRECT, directory: inviteDown.directory })).toEqual({
      ok: false,
      error: "Falha ao convidar: Auth fora do ar (invite)",
    });

    const grantDown = memoryDirectory([OWNER], { failOn: "grantAdmin" });
    expect(await inviteAdmin({ email: "nova@exemplo.com", redirectTo: REDIRECT, directory: grantDown.directory })).toEqual({
      ok: false,
      error: "Convite enviado, mas falhou ao marcar como admin: Auth fora do ar (grantAdmin)",
    });
  });
});

describe("removeAdmin", () => {
  const SECOND = account("second", "segunda@exemplo.com", { isAdmin: true });

  it("apaga a conta de outro admin", async () => {
    const memory = memoryDirectory([OWNER, SECOND]);

    const result = await removeAdmin({ currentUserId: "owner", targetUserId: "second", directory: memory.directory });

    expect(result).toEqual({ ok: true, message: "Acesso removido." });
    expect(memory.users.map((user) => user.id)).toEqual(["owner"]);
  });

  it("não deixa remover a si mesmo", async () => {
    const memory = memoryDirectory([OWNER, SECOND]);
    const result = await removeAdmin({ currentUserId: "owner", targetUserId: "owner", directory: memory.directory });
    expect(result).toEqual({ ok: false, error: "Você não pode remover a si mesmo." });
    expect(memory.users).toHaveLength(2);
  });

  it("só apaga contas de admin, nunca qualquer usuário (controle de acesso)", async () => {
    const memory = memoryDirectory([OWNER, SECOND, account("comum", "comum@exemplo.com")]);

    const result = await removeAdmin({ currentUserId: "owner", targetUserId: "comum", directory: memory.directory });

    expect(result).toEqual({ ok: false, error: "Admin não encontrado." });
    expect(memory.users).toHaveLength(3);
  });

  it("mantém pelo menos um admin", async () => {
    const memory = memoryDirectory([OWNER, account("ex", "ex@exemplo.com")]);
    // Um admin logado que perdeu a role no meio do caminho tenta remover o último admin.
    const result = await removeAdmin({ currentUserId: "ex", targetUserId: "owner", directory: memory.directory });
    expect(result).toEqual({ ok: false, error: "É preciso manter pelo menos um admin." });
    expect(memory.adminEmails()).toEqual(["sabino@exemplo.com"]);
  });
});

describe("toAdminList", () => {
  it("lista só admins, por e-mail, marcando quem ainda não aceitou o convite", () => {
    const list = toAdminList([
      account("comum", "comum@exemplo.com"),
      account("z", "zeca@exemplo.com", { isAdmin: true, invitedAt: "2026-11-03T00:00:00Z" }),
      OWNER,
      account("sem-email", "", { isAdmin: true, lastSignInAt: "2026-11-01T00:00:00Z" }),
    ]);

    expect(list.map((admin) => [admin.email, admin.pending])).toEqual([
      ["", false],
      ["sabino@exemplo.com", false],
      ["zeca@exemplo.com", true],
    ]);
  });

  it("mostra um texto no lugar de e-mail ausente", () => {
    const [admin] = toAdminList([{ ...OWNER, email: null }]);
    expect(admin.email).toBe("(sem e-mail)");
  });
});
