// Textos prontos por ramo para o "Preencher automaticamente". Mesma regra do miniAutofill:
// nada de fatos inventados (prazos, anos de mercado, preços, entrega grátis); só frases que valem
// para qualquer negócio do ramo. Descrição, missão, visão e valores vêm do segmento.
import type { Faq } from './miniPage';
import type { NicheId } from './miniNicheCore';

export type Info = { name: string; city: string; address: string; hours: string; rating: number | null; ratingCount: number | null };
export type NicheTexts = {
  headlines: ((i: Info) => string)[]; taglines: string[]; cta: string[]; message: string;
  benefits: [icon: string, title: string, text: string][]; faq: Faq[]; finals: [string, string][];
};

const em = (i: Info) => (i.city ? ` em ${i.city}` : '');
const q = (qq: string, a: string): Faq => ({ id: '', q: qq, a });

export const NICHE_TEXTS: Record<NicheId, NicheTexts> = {
  pizzaria: {
    headlines: [() => 'Pizza quentinha e burger caprichado do jeito que você gosta', i => `${i.name}: a pizza que chega quente${em(i)}`, () => 'Bateu a fome? A gente resolve'],
    taglines: ['Massa saborosa, ingredientes selecionados e pedido fácil pelo WhatsApp.', 'Peça para entrega ou retire no balcão.', 'Do forno para a sua mesa, com todo o capricho.'],
    cta: ['Pedir pelo WhatsApp', 'Fazer meu pedido', 'Ver sabores e pedir'], message: 'Olá! Vim pela página de vocês e quero fazer um pedido.',
    benefits: [['heart', 'Feito com capricho', 'Cada pizza montada na hora.'], ['leaf', 'Ingredientes selecionados', 'Sabor que você sente na primeira mordida.'], ['truck', 'Entrega ou retirada', 'Como for melhor para você.'], ['zap', 'Pedido fácil', 'Pelo WhatsApp em poucos toques.']],
    faq: [q('Como faço meu pedido?', 'Toque no botão do WhatsApp, escolha os sabores e informe o endereço.'), q('Vocês entregam no meu bairro?', 'Consulte pelo WhatsApp a área de entrega.')],
    finals: [['Bateu a fome?', 'Peça agora pelo WhatsApp.'], ['Sua pizza está a um toque', 'Chame no WhatsApp e faça seu pedido.']],
  },
  restaurante: {
    headlines: [() => 'Comida caseira de verdade, todo dia', i => `${i.name}: almoço com gostinho de casa`, i => `Refeições caprichadas${em(i)}`],
    taglines: ['Prato feito, marmitas e comida feita na hora, com tempero de casa.', 'Peça sua marmita pelo WhatsApp ou venha almoçar com a gente.', 'Comida boa, bem servida e no seu horário.'],
    cta: ['Pedir minha marmita', 'Ver o cardápio do dia', 'Fazer meu pedido'], message: 'Olá! Vim pela página de vocês e quero saber o cardápio de hoje.',
    benefits: [['heart', 'Tempero caseiro', 'Comida feita com carinho.'], ['leaf', 'Feito no dia', 'Ingredientes frescos todos os dias.'], ['smile', 'Bem servido', 'Prato que mata a fome de verdade.'], ['zap', 'Pedido fácil', 'Peça pelo WhatsApp.']],
    faq: [q('Qual é o cardápio de hoje?', 'Chame no WhatsApp que enviamos o cardápio do dia.'), q('Vocês fazem marmitas para empresas?', 'Fale com a gente pelo WhatsApp e combinamos.')],
    finals: [['O almoço de hoje já está saindo', 'Peça pelo WhatsApp.'], ['Bateu a fome?', 'Garanta sua marmita pelo WhatsApp.']],
  },
  cafeteria: {
    headlines: [() => 'Café especial e delícias feitas com carinho', i => `${i.name}: uma pausa gostosa no seu dia`, i => `O café que você procurava${em(i)}`],
    taglines: ['Cafés, pães e doces para os seus melhores momentos.', 'Venha tomar um café com a gente ou faça sua encomenda pelo WhatsApp.', 'Ambiente acolhedor e sabores que fazem você voltar.'],
    cta: ['Fazer uma encomenda', 'Reservar uma mesa', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de fazer uma encomenda.',
    benefits: [['heart', 'Feito com carinho', 'Receitas preparadas com cuidado.'], ['leaf', 'Ingredientes de qualidade', 'Sabor que faz diferença.'], ['smile', 'Ambiente acolhedor', 'Um lugar bom para ficar.'], ['calendar', 'Encomendas', 'Bolos e doces sob encomenda.']],
    faq: [q('Vocês aceitam encomendas?', 'Sim! Fale com a gente pelo WhatsApp e conte o que você precisa.'), q('Tem opções sem lactose?', 'Consulte as opções disponíveis pelo WhatsApp.')],
    finals: [['Seu próximo café já está esperando', 'Fale com a gente pelo WhatsApp.'], ['Que tal uma pausa gostosa?', 'Venha nos visitar ou faça sua encomenda.']],
  },
  acai: {
    headlines: [() => 'Açaí cremoso e doces que alegram o dia', i => `${i.name}: monte o seu do seu jeito`, i => `Açaí, sorvetes e doces${em(i)}`],
    taglines: ['Escolha seus acompanhamentos preferidos e peça pelo WhatsApp.', 'Geladinho, cremoso e do jeito que você gosta.', 'Venha nos visitar ou peça para levar.'],
    cta: ['Montar meu açaí', 'Fazer meu pedido', 'Pedir pelo WhatsApp'], message: 'Oi! Vim pela página de vocês e quero fazer um pedido.',
    benefits: [['sparkles', 'Do seu jeito', 'Monte com seus acompanhamentos favoritos.'], ['heart', 'Feito com carinho', 'Qualidade em cada copo.'], ['smile', 'Para toda a família', 'Opções para todos os gostos.'], ['zap', 'Pedido fácil', 'Peça pelo WhatsApp.']],
    faq: [q('Fazem entrega?', 'Consulte pelo WhatsApp a área de entrega.'), q('Quais acompanhamentos vocês têm?', 'Chame no WhatsApp e enviamos a lista completa.')],
    finals: [['Bateu a vontade?', 'Monte o seu pelo WhatsApp.'], ['Que tal um docinho agora?', 'Peça pelo WhatsApp em poucos toques.']],
  },
  adega: {
    headlines: [() => 'Vinhos, cervejas e destilados para cada ocasião', i => `${i.name}: a bebida certa para o seu momento`, i => `Sua adega de confiança${em(i)}`],
    taglines: ['Ajudamos você a escolher o rótulo ideal e entregamos gelado.', 'Encomende pelo WhatsApp para a sua festa ou o seu jantar.', 'Variedade, preço justo e atendimento de quem entende.'],
    cta: ['Encomendar pelo WhatsApp', 'Ver bebidas disponíveis', 'Falar com a gente'], message: 'Olá! Vim pela página de vocês e gostaria de fazer uma encomenda.',
    benefits: [['award', 'Variedade', 'Rótulos para todos os gostos.'], ['users', 'Ajuda na escolha', 'Indicamos a bebida certa.'], ['truck', 'Entrega', 'Consulte a entrega na sua região.'], ['star', 'Presentes', 'Opções para presentear.']],
    faq: [q('Vocês fazem entrega?', 'Consulte pelo WhatsApp a entrega para o seu endereço.'), q('Fazem preço para eventos?', 'Sim, peça seu orçamento pelo WhatsApp.')],
    finals: [['A festa começa aqui', 'Encomende pelo WhatsApp.'], ['Brinde com a gente', 'Fale com a gente e garanta sua bebida.']],
  },
  salao: {
    headlines: [() => 'Cabelo bonito, do jeito que você sempre quis', i => `${i.name}: seu momento de cuidado`, i => `Seu salão de beleza${em(i)}`],
    taglines: ['Cortes, cor e tratamentos com profissionais atenciosas.', 'Agende pelo WhatsApp e reserve um tempo só seu.', 'Cuidado em cada detalhe para você sair se sentindo linda.'],
    cta: ['Agendar meu horário', 'Quero agendar', 'Agendar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar um horário.',
    benefits: [['sparkles', 'Resultado caprichado', 'Atenção aos detalhes.'], ['heart', 'Atendimento acolhedor', 'Sem pressa, do seu jeito.'], ['calendar', 'Hora marcada', 'Agende pelo WhatsApp.'], ['shield', 'Produtos de qualidade', 'Cuidado com o seu cabelo.']],
    faq: [q('Preciso agendar?', 'Recomendamos agendar pelo WhatsApp para garantir o seu horário.'), q('Atendem noivas e festas?', 'Fale com a gente pelo WhatsApp e montamos o seu atendimento.')],
    finals: [['Que tal reservar um tempo para você?', 'Agende pelo WhatsApp.'], ['Seu novo visual começa aqui', 'Chame no WhatsApp e escolha seu horário.']],
  },
  unhas: {
    headlines: [() => 'Unhas impecáveis e olhar marcante', i => `${i.name}: unhas, cílios e sobrancelhas no capricho`, i => `Seu estúdio de beleza${em(i)}`],
    taglines: ['Manicure, alongamento, cílios e sobrancelhas com atendimento caprichado.', 'Agende pelo WhatsApp e garanta seu horário.', 'Materiais esterilizados e muito carinho em cada detalhe.'],
    cta: ['Agendar meu horário', 'Quero agendar', 'Agendar pelo WhatsApp'], message: 'Oi! Vim pela página de vocês e quero agendar um horário.',
    benefits: [['sparkles', 'Acabamento perfeito', 'Atenção a cada detalhe.'], ['shield', 'Higiene em primeiro lugar', 'Materiais esterilizados.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['heart', 'Atendimento com carinho', 'Um momento só seu.']],
    faq: [q('Como faço para agendar?', 'Toque no botão do WhatsApp e escolha o serviço e o horário.'), q('Quanto tempo dura o atendimento?', 'Depende do serviço. Consulte pelo WhatsApp.')],
    finals: [['Bora deixar tudo no capricho?', 'Agende pelo WhatsApp.'], ['Seu momento de beleza te espera', 'Chame no WhatsApp e escolha o horário.']],
  },
  estetica: {
    headlines: [() => 'Pele bonita e saudável, com quem entende', i => `${i.name}: estética com cuidado de verdade`, i => `Tratamentos estéticos${em(i)}`],
    taglines: ['Tratamentos faciais e corporais pensados para você.', 'Agende sua avaliação pelo WhatsApp.', 'Técnica, cuidado e um ambiente feito para relaxar.'],
    cta: ['Agendar avaliação', 'Quero agendar', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar uma avaliação.',
    benefits: [['sparkles', 'Tratamento personalizado', 'Pensado para a sua pele.'], ['shield', 'Segurança', 'Cuidado em cada etapa.'], ['heart', 'Ambiente relaxante', 'Um momento de pausa.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.']],
    faq: [q('Como funciona a avaliação?', 'Fale com a gente pelo WhatsApp e explicamos tudo.'), q('Quantas sessões vou precisar?', 'Depende de cada caso. Indicamos o ideal na avaliação.')],
    finals: [['Sua pele merece esse cuidado', 'Agende pelo WhatsApp.'], ['Que tal começar hoje?', 'Chame no WhatsApp e agende sua avaliação.']],
  },
  barbearia: {
    headlines: [() => 'Corte na régua e barba alinhada', i => `${i.name}: estilo e atendimento de verdade`, i => `A barbearia que você procurava${em(i)}`],
    taglines: ['Profissionais caprichosos, ambiente descontraído e horário marcado sem complicação.', 'Agende pelo WhatsApp e garanta seu horário.', 'Do clássico ao moderno, seu visual em boas mãos.'],
    cta: ['Marcar meu horário', 'Agendar meu corte', 'Agendar pelo WhatsApp'], message: 'Fala! Vim pela página de vocês e quero marcar um horário.',
    benefits: [['award', 'Acabamento caprichado', 'Atenção a cada detalhe do corte e da barba.'], ['calendar', 'Horário marcado', 'Agende pelo WhatsApp.'], ['smile', 'Ambiente descontraído', 'Bom papo e clima de casa.'], ['sparkles', 'Do seu jeito', 'Do clássico ao moderno.']],
    faq: [q('Preciso marcar horário?', 'Recomendamos agendar pelo WhatsApp para garantir seu horário.'), q('Atendem crianças?', 'Consulte pelo WhatsApp.')],
    finals: [['Bora dar um trato no visual?', 'Chame no WhatsApp e escolha seu horário.'], ['Seu próximo corte está a um toque', 'Agende agora pelo WhatsApp.']],
  },
  dentista: {
    headlines: [() => 'Seu sorriso cuidado com atenção e carinho', i => `${i.name}: odontologia de confiança`, i => `Dentista${em(i)}`],
    taglines: ['Avaliação, limpeza, estética e tratamentos com atendimento humanizado.', 'Agende sua avaliação pelo WhatsApp.', 'Explicamos cada etapa antes de começar.'],
    cta: ['Agendar avaliação', 'Agendar consulta', 'Falar com a recepção'], message: 'Olá! Vim pela página de vocês e gostaria de agendar uma avaliação.',
    benefits: [['shield', 'Biossegurança', 'Materiais esterilizados e ambiente seguro.'], ['heart', 'Atendimento humanizado', 'Sem pressa e com explicação.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['smile', 'Sorriso confiante', 'Tratamentos para cada necessidade.']],
    faq: [q('Atendem convênio?', 'Consulte pelo WhatsApp as formas de atendimento.'), q('Como agendo uma avaliação?', 'Toque no botão do WhatsApp e escolha o melhor horário.')],
    finals: [['Bora cuidar desse sorriso?', 'Agende pelo WhatsApp.'], ['Sorria com confiança', 'Fale com a recepção pelo WhatsApp.']],
  },
  terapias: {
    headlines: [() => 'Cuidado para o corpo e a mente', i => `${i.name}: saúde com acolhimento`, i => `Saúde e bem-estar${em(i)}`],
    taglines: ['Atendimento humanizado e plano de cuidado pensado para você.', 'Agende sua consulta pelo WhatsApp.', 'Escuta atenta e acompanhamento de perto.'],
    cta: ['Agendar consulta', 'Agendar avaliação', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar uma consulta.',
    benefits: [['heart', 'Acolhimento', 'Escuta sem pressa.'], ['users', 'Acompanhamento de perto', 'Plano de cuidado para você.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['shield', 'Responsabilidade', 'Cuidado ético e seguro.']],
    faq: [q('Como agendo uma consulta?', 'Toque no botão do WhatsApp e fale com a gente.'), q('Atendem on-line?', 'Consulte pelo WhatsApp as opções de atendimento.')],
    finals: [['Cuide de você sem esperar', 'Agende pelo WhatsApp.'], ['Estamos prontos para te atender', 'Fale com a gente pelo WhatsApp.']],
  },
  veterinaria: {
    headlines: [() => 'Cuidado veterinário com amor e atenção', i => `${i.name}: seu pet em boas mãos`, i => `Clínica veterinária${em(i)}`],
    taglines: ['Consultas, vacinas e exames com quem ama os animais.', 'Agende pelo WhatsApp a consulta do seu pet.', 'Atendimento calmo e explicação em cada etapa.'],
    cta: ['Agendar consulta', 'Falar com a clínica', 'Agendar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar uma consulta para o meu pet.',
    benefits: [['heart', 'Muito carinho', 'Manejo gentil e sem estresse.'], ['shield', 'Cuidado responsável', 'Atenção em cada detalhe.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['users', 'Equipe dedicada', 'Quem ama bicho de verdade.']],
    faq: [q('Atendem gatos e cães?', 'Consulte pelo WhatsApp as espécies atendidas.'), q('Como agendo uma consulta?', 'Toque no botão do WhatsApp e escolha o horário.')],
    finals: [['Seu pet em boas mãos', 'Agende pelo WhatsApp.'], ['Cuidado de verdade para quem você ama', 'Fale com a gente pelo WhatsApp.']],
  },
  petshop: {
    headlines: [() => 'Banho, tosa e mimos para o seu melhor amigo', i => `${i.name}: seu pet cheiroso e feliz`, i => `Pet shop${em(i)}`],
    taglines: ['Banho, tosa, rações e acessórios com muito carinho.', 'Agende o banho do seu pet pelo WhatsApp.', 'Porque o seu melhor amigo merece o melhor.'],
    cta: ['Agendar banho e tosa', 'Agendar pelo WhatsApp', 'Falar com a gente'], message: 'Oi! Vim pela página de vocês e quero agendar um banho para o meu pet.',
    benefits: [['heart', 'Muito carinho', 'Seu pet tratado como da família.'], ['shield', 'Produtos seguros', 'Cuidado com a pele e o pelo.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['smile', 'Pet feliz', 'Atendimento sem estresse.']],
    faq: [q('Vocês buscam o pet em casa?', 'Consulte pelo WhatsApp o leva e traz na sua região.'), q('Atendem todos os portes?', 'Consulte pelo WhatsApp e tiramos suas dúvidas.')],
    finals: [['Seu pet vai adorar', 'Agende pelo WhatsApp.'], ['Hora do banho!', 'Chame no WhatsApp e garanta o horário.']],
  },
  academia: {
    headlines: [() => 'Treine forte. Evolua todo dia.', i => `${i.name}: seu treino começa aqui`, () => 'Mais saúde, mais energia, mais você'],
    taglines: ['Estrutura, acompanhamento e motivação para você chegar no seu objetivo.', 'Fale com a gente pelo WhatsApp e conheça os planos.', 'Do primeiro treino à meta alcançada, estamos com você.'],
    cta: ['Quero começar', 'Conhecer os planos', 'Agendar uma visita'], message: 'Olá! Vim pela página de vocês e quero conhecer os planos.',
    benefits: [['zap', 'Mais energia', 'Treinos que cabem na sua rotina.'], ['users', 'Acompanhamento', 'Professores orientando você.'], ['award', 'Foco no resultado', 'Planejamento para evoluir.'], ['smile', 'Ambiente motivador', 'Clima bom para não desistir.']],
    faq: [q('Posso conhecer antes de me matricular?', 'Fale com a gente pelo WhatsApp e agende uma visita.'), q('Quais são os planos?', 'Chame no WhatsApp e enviamos os planos e valores.')],
    finals: [['Seu primeiro passo começa hoje', 'Chame no WhatsApp e conheça os planos.'], ['Bora treinar?', 'Fale com a gente pelo WhatsApp.']],
  },
  pilates: {
    headlines: [() => 'Movimento, respiração e bem-estar', i => `${i.name}: pilates e yoga para o seu corpo`, i => `Seu estúdio de pilates${em(i)}`],
    taglines: ['Aulas com atenção de perto, no seu ritmo.', 'Agende sua aula experimental pelo WhatsApp.', 'Fortaleça o corpo, melhore a postura e respire melhor.'],
    cta: ['Agendar aula experimental', 'Conhecer as aulas', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e quero agendar uma aula experimental.',
    benefits: [['users', 'Atenção de perto', 'Cuidado com cada movimento.'], ['heart', 'Para todas as idades', 'Do iniciante ao avançado.'], ['leaf', 'Ambiente calmo', 'Um lugar para desacelerar.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.']],
    faq: [q('Nunca fiz pilates. Posso começar?', 'Pode! Agende uma aula experimental pelo WhatsApp.'), q('Quantas vezes por semana?', 'Fale com a gente e indicamos o plano ideal.')],
    finals: [['Respire fundo e comece hoje', 'Agende pelo WhatsApp.'], ['Seu corpo agradece', 'Fale com a gente pelo WhatsApp.']],
  },
  oficina: {
    headlines: [() => 'Seu carro em boas mãos', i => `${i.name}: mecânica de confiança`, i => `Oficina mecânica${em(i)}`],
    taglines: ['Serviço bem feito, orçamento claro e atendimento transparente.', 'Peça seu orçamento pelo WhatsApp.', 'Você aprova cada serviço antes de começarmos.'],
    cta: ['Pedir orçamento', 'Agendar serviço', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de um orçamento para o meu carro.',
    benefits: [['wrench', 'Serviço bem feito', 'Atenção técnica em cada etapa.'], ['thumbs', 'Orçamento claro', 'Você aprova antes de começar.'], ['shield', 'Confiança', 'Transparência do começo ao fim.'], ['clock', 'Agilidade', 'Seu carro pronto o quanto antes.']],
    faq: [q('Como peço um orçamento?', 'Toque no botão do WhatsApp e conte o que o seu carro precisa.'), q('Preciso agendar?', 'Recomendamos combinar pelo WhatsApp.')],
    finals: [['Barulho estranho no carro?', 'Peça seu orçamento pelo WhatsApp.'], ['Vamos resolver isso?', 'Chame no WhatsApp agora.']],
  },
  lavacar: {
    headlines: [() => 'Seu carro limpo e brilhando', i => `${i.name}: cuidado completo para o seu carro`, i => `Lava-car${em(i)}`],
    taglines: ['Lavagem, polimento e higienização com produtos de qualidade.', 'Agende sua lavagem pelo WhatsApp.', 'Capricho em cada detalhe, por dentro e por fora.'],
    cta: ['Agendar lavagem', 'Pedir orçamento', 'Falar no WhatsApp'], message: 'Oi! Vim pela página de vocês e quero agendar uma lavagem.',
    benefits: [['sparkles', 'Brilho de verdade', 'Acabamento caprichado.'], ['shield', 'Cuidado com a pintura', 'Produtos de qualidade.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['thumbs', 'Atendimento claro', 'Você sabe o que vai ser feito.']],
    faq: [q('Precisa agendar?', 'Recomendamos agendar pelo WhatsApp para não esperar.'), q('Quais serviços vocês fazem?', 'Chame no WhatsApp e enviamos a lista completa.')],
    finals: [['Bora deixar o carro um brinco?', 'Agende pelo WhatsApp.'], ['Seu carro merece esse cuidado', 'Fale com a gente pelo WhatsApp.']],
  },
  jardinagem: {
    headlines: [() => 'Jardins bonitos o ano inteiro', i => `${i.name}: paisagismo e jardinagem de confiança`, i => `Jardinagem e paisagismo${em(i)}`],
    taglines: ['Projeto, plantio e manutenção para o seu jardim ficar sempre bonito.', 'Peça seu orçamento pelo WhatsApp.', 'Plantas certas para o seu espaço.'],
    cta: ['Pedir orçamento', 'Agendar uma visita', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de um orçamento para o meu jardim.',
    benefits: [['leaf', 'Plantas certas', 'Espécies que combinam com o seu espaço.'], ['calendar', 'Manutenção programada', 'Seu jardim sempre em dia.'], ['thumbs', 'Orçamento claro', 'Sem surpresas.'], ['users', 'Equipe de confiança', 'Profissionais caprichosos.']],
    faq: [q('Atendem condomínios e empresas?', 'Sim, fale com a gente pelo WhatsApp.'), q('Como peço um orçamento?', 'Toque no botão do WhatsApp e mande fotos do espaço.')],
    finals: [['Seu jardim pode ficar assim', 'Peça seu orçamento pelo WhatsApp.'], ['Vamos deixar tudo verde?', 'Chame no WhatsApp.']],
  },
  loja: {
    headlines: [() => 'Moda e presentes que combinam com você', i => `${i.name}: o que você procura está aqui`, i => `Sua loja${em(i)}`],
    taglines: ['Novidades sempre chegando e atendimento que ajuda você a escolher.', 'Peça fotos e tamanhos pelo WhatsApp.', 'Venha nos visitar ou compre pelo WhatsApp.'],
    cta: ['Ver novidades no WhatsApp', 'Comprar pelo WhatsApp', 'Falar com uma vendedora'], message: 'Oi! Vim pela página de vocês e quero ver as novidades.',
    benefits: [['sparkles', 'Novidades', 'Sempre tem peça nova.'], ['heart', 'Ajuda na escolha', 'A gente ajuda a montar o look.'], ['zap', 'Compra fácil', 'Peça pelo WhatsApp.'], ['star', 'Qualidade', 'Peças escolhidas com cuidado.']],
    faq: [q('Vocês fazem trocas?', 'Consulte pelo WhatsApp a política de trocas.'), q('Enviam para outras cidades?', 'Consulte pelo WhatsApp as opções de envio.')],
    finals: [['Chegou novidade!', 'Peça as fotos pelo WhatsApp.'], ['Encontrou o que procurava?', 'Fale com a gente e garanta o seu.']],
  },
  assistencia: {
    headlines: [() => 'Celular e computador consertados com rapidez', i => `${i.name}: assistência técnica de confiança`, i => `Assistência técnica${em(i)}`],
    taglines: ['Troca de tela, bateria e reparos com peças de qualidade.', 'Mande o modelo pelo WhatsApp e receba o orçamento.', 'Técnicos especializados e atendimento transparente.'],
    cta: ['Pedir orçamento', 'Falar com um técnico', 'Mandar meu modelo'], message: 'Olá! Vim pela página de vocês e quero um orçamento para o meu aparelho.',
    benefits: [['zap', 'Rapidez', 'Seu aparelho de volta o quanto antes.'], ['shield', 'Peças de qualidade', 'Conserto que dura.'], ['thumbs', 'Orçamento claro', 'Você aprova antes do conserto.'], ['wrench', 'Técnicos especializados', 'Experiência em vários modelos.']],
    faq: [q('Como peço um orçamento?', 'Mande o modelo do aparelho e o problema pelo WhatsApp.'), q('Vocês dão garantia?', 'Consulte pelo WhatsApp a garantia de cada serviço.')],
    finals: [['Tela quebrada? Resolve hoje.', 'Peça o orçamento pelo WhatsApp.'], ['Seu aparelho em boas mãos', 'Fale com a gente pelo WhatsApp.']],
  },
};
