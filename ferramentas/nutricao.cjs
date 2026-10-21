// Informação nutricional fornecida pelo Hicks (enviada pelo Neto em 19/10/2026).
// Chave: id do item no cardápio. "aprox: true" quando o Hicks informou os valores como aproximados (≈).
// Cada nutriente: [valor, %VD]. %VD vazio quando não informado; '**' quando não há %VD estabelecido.
// Ordem de exibição segue a tabela nutricional brasileira (RDC 429/2020).

const ORDEM = [
  ['carb', 'Carboidratos'],
  ['acTot', 'Açúcares totais'],
  ['acAd', 'Açúcares adicionados'],
  ['prot', 'Proteínas'],
  ['gord', 'Gorduras totais'],
  ['sat', 'Gorduras saturadas'],
  ['trans', 'Gorduras trans'],
  ['fibra', 'Fibra alimentar'],
  ['sodio', 'Sódio'],
];

const NUTRI = {
  // Cheese Burger
  2108708: { porcao: '1 lanche (aprox. 176 g)', aprox: false, kcal: 523, kcalVD: '26%', n: {
    carb: ['30,7 g', '10%'], acTot: ['4,6 g', '**'], acAd: ['3,6 g', '7%'], prot: ['26,0 g', '52%'], gord: ['32,3 g', '50%'],
    sat: ['11,3 g', '57%'], trans: ['0,03 g', ''], fibra: ['1,0 g', '4%'], sodio: ['775 mg', '39%'] } },
  // O Clássico (enviado como "Cheese Bacon — Brie"; o queijo é cheddar, confirmado pelo Hicks em 20/10/2026)
  2108699: { porcao: '1 lanche (aprox. 221 g)', aprox: false, kcal: 772, kcalVD: '39%', n: {
    carb: ['32,6 g', '11%'], acTot: ['4,8 g', '**'], acAd: ['3,8 g', '8%'], prot: ['28,6 g', '57%'], gord: ['58,0 g', '89%'],
    sat: ['16,7 g', '84%'], trans: ['0,15 g', '8%'], fibra: ['1,0 g', '4%'], sodio: ['1.073 mg', '54%'] } },
  // Quarterão Angus Premium
  5101889: { porcao: '1 lanche (aprox. 256 g)', aprox: true, kcal: 578, kcalVD: '29%', n: {
    carb: ['42,2 g', '14%'], acTot: ['9,2 g', '**'], acAd: ['7,4 g', '15%'], prot: ['26,7 g', '53%'], gord: ['32,8 g', '50%'],
    sat: ['11,3 g', '57%'], trans: ['0,03 g', ''], fibra: ['1,9 g', '8%'], sodio: ['1.251 mg', '63%'] } },
  // Cheese Salada
  2108709: { porcao: '1 lanche (aprox. 261 g)', aprox: true, kcal: 734, kcalVD: '37%', n: {
    carb: ['36,2 g', '12%'], acTot: ['6,3 g', '**'], acAd: ['3,8 g', '8%'], prot: ['26,7 g', '53%'], gord: ['53,0 g', '82%'],
    sat: ['14,9 g', '75%'], trans: ['0,15 g', ''], fibra: ['1,7 g', '7%'], sodio: ['957 mg', '48%'] } },
  // Montevidéu (Angus no Alho)
  2108692: { porcao: '1 lanche (aprox. 261 g)', aprox: true, kcal: 805, kcalVD: '40%', n: {
    carb: ['41,8 g', '14%'], acTot: ['9,4 g', '**'], acAd: ['7,8 g', '16%'], prot: ['29,4 g', '59%'], gord: ['57,9 g', '89%'],
    sat: ['16,7 g', '84%'], trans: ['0,15 g', ''], fibra: ['1,3 g', '5%'], sodio: ['1.250 mg', '63%'] } },
  // Vila Nova (Onion Rings & Bacon)
  2108704: { porcao: '1 lanche (aprox. 255 g)', aprox: true, kcal: 625, kcalVD: '31%', n: {
    carb: ['49,4 g', '16%'], acTot: ['8,0 g', '**'], acAd: ['7,6 g', '15%'], prot: ['28,8 g', '58%'], gord: ['37,0 g', '57%'],
    sat: ['12,2 g', '61%'], trans: ['0 g', ''], fibra: ['1,4 g', '6%'], sodio: ['1.123 mg', '56%'] } },
  // Tex-Mex (Jalapeño Apimentado)
  2108690: { porcao: '1 lanche (aprox. 246 g)', aprox: true, kcal: 721, kcalVD: '36%', n: {
    carb: ['34,5 g', '12%'], acTot: ['5,0 g', '**'], acAd: ['4,0 g', '8%'], prot: ['28,6 g', '57%'], gord: ['51,1 g', '79%'],
    sat: ['15,5 g', '78%'], trans: ['0,11 g', ''], fibra: ['1,3 g', '5%'], sodio: ['1.280 mg', '64%'] } },
  // Duplo Aversa (Duplo Angus)
  2108706: { porcao: '1 lanche (aprox. 485 g)', aprox: true, kcal: 1536, kcalVD: '77%', n: {
    carb: ['53,5 g', '18%'], acTot: ['5,2 g', '**'], acAd: ['3,8 g', '8%'], prot: ['62,3 g', '125%'], gord: ['113,1 g', '174%'],
    sat: ['37,3 g', '187%'], trans: ['≥ 0,8 g', '≥ 40%'], fibra: ['2,6 g', '10%'], sodio: ['1.670 mg', '84%'] } },
  // Aversa (Angus + Muçarela Crocante)
  4854487: { porcao: '1 lanche (aprox. 355 g)', aprox: true, kcal: 1220, kcalVD: '61%', n: {
    carb: ['52,3 g', '17%'], acTot: ['5,1 g', '**'], acAd: ['3,8 g', '8%'], prot: ['42,0 g', '84%'], gord: ['87,0 g', '134%'],
    sat: ['28,4 g', '142%'], trans: ['≥ 0,8 g', '≥ 40%'], fibra: ['2,2 g', '9%'], sodio: ['1.250 mg', '63%'] } },
  // Baba-Yaga (enviado como "Angus + Chicken & Catupiry", 510 g; em 20/10/2026 o Hicks confirmou que o lanche não leva frango)
  2108707: { porcao: '1 lanche (aprox. 510 g)', aprox: true, kcal: 1445, kcalVD: '72%', n: {
    carb: ['70,7 g', '24%'], acTot: ['5,5 g', '**'], acAd: ['4,2 g', '8%'], prot: ['59,3 g', '119%'], gord: ['103,9 g', '160%'],
    sat: ['32,7 g', '164%'], trans: ['≥ 1,1 g', '≥ 55%'], fibra: ['5,5 g', '22%'], sodio: ['1.943 mg', '97%'] } },
  // Elite (Chicken Crispy)
  2108688: { porcao: '1 lanche (aprox. 320 g)', aprox: true, kcal: 1070, kcalVD: '54%', n: {
    carb: ['64,2 g', '21%'], acTot: ['4,6 g', '**'], acAd: ['4,3 g', '9%'], prot: ['41,9 g', '84%'], gord: ['71,6 g', '110%'],
    sat: ['19,9 g', '100%'], trans: ['0,9 g', '45%'], fibra: ['5,2 g', '21%'], sodio: ['1.552 mg', '78%'] } },
  // Chicken Salad
  2108702: { porcao: '1 lanche (aprox. 235 g)', aprox: true, kcal: 636, kcalVD: '32%', n: {
    carb: ['46,1 g', '15%'], acTot: ['4,7 g', '**'], acAd: ['4,3 g', '9%'], prot: ['29,9 g', '60%'], gord: ['37,6 g', '58%'],
    sat: ['6,9 g', '35%'], trans: ['0,2 g', '10%'], fibra: ['1,2 g', '5%'], sodio: ['957 mg', '48%'] } },
  // Kentucky (enviado como "Kentucky Jr")
  2108710: { porcao: '1 lanche (aprox. 205 g)', aprox: true, kcal: 614, kcalVD: '31%', n: {
    carb: ['45,7 g', '15%'], acTot: ['4,4 g', '**'], acAd: ['4,3 g', '9%'], prot: ['19,4 g', '39%'], gord: ['38,6 g', '59%'],
    sat: ['6,3 g', '32%'], trans: ['0,2 g', '10%'], fibra: ['4,1 g', '16%'], sodio: ['847 mg', '42%'] } },

  // Acompanhamentos: porção de referência do fabricante (pode ser diferente da porção servida).
  // Fritas do Hick's (McCain SureCrisp 7 mm)
  1292560: { porcao: '130 g (pronto para consumo)', aprox: false, ref: true, kcal: 270, kcalVD: '14%', n: {
    carb: ['32,5 g', '11%'], acTot: ['0 g', '**'], acAd: ['0 g', '0%'], prot: ['2,6 g', '5%'], gord: ['14,3 g', '22%'],
    sat: ['2,6 g', '13%'], trans: ['0 g', '0%'], fibra: ['2,1 g', '8%'], sodio: ['272 mg', '14%'] } },
  // Anéis de cebola
  1292565: { porcao: '100 g (pronto para consumo)', aprox: false, ref: true, kcal: 263, kcalVD: '13%', n: {
    carb: ['34,1 g', '11%'], acTot: ['6,1 g', '**'], acAd: ['0 g', '0%'], prot: ['4,1 g', '8%'], gord: ['11,9 g', '18%'],
    sat: ['1,8 g', '9%'], trans: ['0 g', '0%'], fibra: ['1,5 g', '6%'], sodio: ['192 mg', '10%'] } },
  // Nuggets (enviado como "Nuggets Chicken Supreme — Seara"; os nuggets são Seara, confirmado em 20/10/2026)
  1292563: { porcao: '200 g', aprox: false, ref: true, kcal: 350, kcalVD: '18%', n: {
    carb: ['20 g', '7%'], prot: ['26 g', '52%'], gord: ['18,6 g', '29%'] } },
  // Almofadinha de Gouda (enviado como "Crispy de Queijo Gouda — McCain")
  1292558: { porcao: '200 g (aprox. 8 unidades)', aprox: false, ref: true, kcal: 552, kcalVD: '28%', n: {
    carb: ['57,6 g', '19%'], acTot: ['não informado', ''], acAd: ['não informado', ''], prot: ['15,2 g', '30%'], gord: ['29,6 g', '46%'],
    sat: ['16,8 g', '84%'], trans: ['0 g', '0%'], sodio: ['1.496 mg', '75%'] } },
};

const kcalTxt = id => NUTRI[id] ? `${NUTRI[id].kcal.toLocaleString('pt-BR')} kcal` : null;
const NOTA_VD = '% Valores Diários de referência com base em uma dieta de 2.000 kcal. Seus valores diários podem ser maiores ou menores dependendo das suas necessidades energéticas.';

module.exports = { NUTRI, ORDEM, kcalTxt, NOTA_VD };
