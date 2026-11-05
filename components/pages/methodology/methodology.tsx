import type { ReactNode } from "react";
import { SiteHeader } from "@/components/blocks/site-header";

/** Página "Como medimos": o método do índice em linguagem simples, para quem quiser conferir os números. */
export function Methodology() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader current="como-medimos" />
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Metodologia</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Como medimos</h1>
          <p className="mt-2 text-muted">
            Cada número do Frangômetro sai de uma etiqueta fotografada no mercado. Aqui está como coletamos, auditamos e
            calculamos, para qualquer pessoa conferir.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 leading-relaxed">
        <Section title="O que medimos">
          <p>
            O preço do <strong>quilo do peito de frango</strong> (filé ou peito com osso, resfriado ou congelado) na etiqueta
            da gôndola de supermercados. Sempre o valor do kg: quando a etiqueta mostra só o preço da bandeja, o kg é o que
            vale. A semana vai de segunda a domingo.
          </p>
        </Section>

        <Section title="Como coletamos">
          <p>
            Voluntários fotografam a etiqueta no mercado e cadastram preço, marca, se é resfriado ou congelado, mercado,
            cidade e a data da coleta. Cada cadastro fica público com a foto, na galeria do site.
          </p>
        </Section>

        <Section title="Como auditamos a foto">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Hash SHA-256:</strong> antes de comprimir a foto, o celular calcula a “impressão digital” do arquivo
              original. A mesma foto não entra duas vezes, e quem tiver o arquivo original pode conferir que é ele.
            </li>
            <li>
              <strong>EXIF:</strong> lemos da própria foto a data e o aparelho em que ela foi tirada. Fotos repassadas por
              aplicativos de mensagem perdem esses dados; elas aparecem como <em>“Sem EXIF original”</em>.
            </li>
          </ul>
        </Section>

        <Section title="O que entra no índice">
          <p>
            Só o <strong>preço normal de gôndola</strong>, que vale para qualquer cliente. Ofertas e preços de clube de
            desconto aparecem no site, mas ficam fora do índice e do preço médio, porque são temporários ou exclusivos.
          </p>
        </Section>

        <Section title="Como calculamos a variação">
          <p>
            Comparar a média de uma semana com a da outra engana: se numa semana coletamos um mercado mais caro, a média
            sobe sem nenhum preço ter subido. Por isso a variação compara sempre <strong>o mesmo produto</strong>: mesmo
            mercado, mesma cidade, mesma marca e mesmo tipo (resfriado ou congelado).
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Cada produto é comparado com o último preço dele mesmo (se pulou semanas, com o último que teve).</li>
            <li>
              A variação da semana é a <strong>média geométrica</strong> dessas variações, o mesmo tipo de conta que o IBGE
              usa no IPCA.
            </li>
            <li>As semanas se encadeiam num índice que começa em 100 na primeira semana.</li>
          </ol>
          <p className="rounded-lg bg-stone-100 p-4 text-sm">
            Exemplo: o Mercado A foi de R$ 20,00 para R$ 22,00 (+10%) e o Mercado B de R$ 20,00 para R$ 18,00 (−10%). A
            variação da semana é √(1,10 × 0,90) − 1 ≈ −0,5%. Um mercado coletado pela primeira vez só passa a contar na
            semana seguinte.
          </p>
          <p>
            O <strong>preço médio</strong> e o gráfico mostram a média simples do que foi coletado na semana, para dar uma
            ideia do valor em reais. As porcentagens vêm sempre do índice.
          </p>
        </Section>

        <Section title="Termômetro salarial">
          <p>
            Mostra quantos quilos um salário compra: salário ÷ preço do kg. “No início” usa o preço médio da primeira
            semana; “hoje” usa esse mesmo preço corrigido pelo índice. Os salários de referência (mínimo e médio) são
            atualizados pela equipe quando mudam.
          </p>
        </Section>

        <Section title="Comparação com a inflação oficial">
          <p>
            Buscamos automaticamente no IBGE o IPCA (índice geral), o grupo Alimentação e bebidas e o subitem Frango em
            pedaços. O IPCA é mensal e sai cerca de 10 dias depois do fim do mês, então a comparação é feita mês a mês, até
            o último mês publicado. Enquanto não há meses em comum, mostramos o IPCA dos últimos 12 meses como referência.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
