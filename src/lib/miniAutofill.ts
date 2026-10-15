// Preenchimento automático do mini site: dados do Google + textos prontos por segmento.
// Os textos não inventam fatos (anos de mercado, entrega grátis, preços): só usam o que veio
// do Google (nome, cidade, nota, horários) e frases que valem para qualquer negócio do segmento.
import type { Benefit, Faq, MiniContent, Stat, Testimonial } from './miniPage';
import { slugify, uid } from './miniPage';
import { NicheId, nicheById } from './miniNicheCore';
import { NICHE_TEXTS } from './miniNicheTexts';

export type GooglePlace = {
  placeId: string; name: string; address: string; phone: string; website: string; hours: string[];
  primaryType: string; types: string[]; category: string; rating: number | null; ratingCount: number | null;
  reviews: { author: string; rating: number; text: string }[]; summary: string; mapsUri: string; reviewUri: string;
};

export type SegmentId = 'gastronomia' | 'beleza' | 'barbearia' | 'saude' | 'fitness' | 'hospedagem' | 'loja' | 'automotivo' | 'pet' | 'educacao' | 'escritorio' | 'servicos';
export type Info = { name: string; city: string; address: string; hours: string; rating: number | null; ratingCount: number | null };

type B = [Benefit['icon'], string, string];
type Segment = {
  id: SegmentId; label: string; listTitle: string;
  headlines: ((i: Info) => string)[]; taglines: string[]; cta: string[]; message: string;
  benefits: B[]; description: ((i: Info) => string)[]; mission: string; vision: string; values: string;
  faq: Faq[]; finals: [string, string][];
};

const em = (i: Info) => (i.city ? ` em ${i.city}` : '');
const q = (qq: string, a: string): Faq => ({ id: '', q: qq, a });

export const SEGMENTS: Segment[] = [
  {
    id: 'gastronomia', label: 'Restaurante, café ou lanchonete', listTitle: 'Cardápio',
    headlines: [() => 'Comida feita com carinho, do jeito que você gosta', i => `${i.name}: sabor que faz você voltar`, i => `O lugar certo para comer bem${em(i)}`],
    taglines: ['Ingredientes selecionados, atendimento acolhedor e aquele sabor que vira hábito.', 'Peça pelo WhatsApp ou venha nos visitar. Tem lugar esperando por você.', 'Do preparo ao atendimento, tudo pensado para a sua experiência ser especial.'],
    cta: ['Fazer meu pedido', 'Pedir pelo WhatsApp', 'Falar com a gente'], message: 'Olá! Vim pela página de vocês e gostaria de fazer um pedido.',
    benefits: [['heart', 'Feito com carinho', 'Receitas preparadas com cuidado em cada detalhe.'], ['leaf', 'Ingredientes selecionados', 'Qualidade que você sente no primeiro pedaço.'], ['smile', 'Atendimento acolhedor', 'Você é recebido como em casa.'], ['zap', 'Pedido fácil', 'Fale com a gente pelo WhatsApp em poucos toques.']],
    description: [i => `${i.name} nasceu da vontade de servir comida boa, com ingredientes de qualidade e um atendimento que faz cada cliente se sentir em casa.`, i => `Aqui, cada prato é preparado com cuidado para transformar uma refeição simples em um bom momento. Venha conhecer ${i.name}.`],
    mission: 'Servir refeições saborosas e de qualidade, com atendimento próximo e acolhedor.', vision: 'Ser o lugar preferido de quem quer comer bem na região.', values: 'Qualidade, cuidado, respeito ao cliente e paixão pelo que fazemos.',
    faq: [q('Como faço meu pedido?', 'É só tocar no botão do WhatsApp aqui na página e mandar sua mensagem. Respondemos o mais rápido possível.'), q('Posso fazer encomendas?', 'Fale com a gente pelo WhatsApp e conte o que você precisa.')],
    finals: [['Bateu a fome?', 'Chame no WhatsApp e faça seu pedido agora mesmo.'], ['Seu próximo prato favorito está aqui', 'Fale com a gente pelo WhatsApp e garanta o seu.']],
  },
  {
    id: 'beleza', label: 'Beleza e estética', listTitle: 'Serviços',
    headlines: [() => 'Realce sua beleza com quem entende do assunto', i => `${i.name}: seu momento de cuidado`, i => `Beleza e bem-estar${em(i)}`],
    taglines: ['Profissionais atenciosos e um ambiente pensado para você relaxar.', 'Agende pelo WhatsApp e reserve um tempo só seu.', 'Cuidado em cada detalhe para você sair se sentindo ainda melhor.'],
    cta: ['Agendar meu horário', 'Quero agendar', 'Agendar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar um horário.',
    benefits: [['sparkles', 'Resultado caprichado', 'Atenção aos detalhes do começo ao fim.'], ['heart', 'Atendimento acolhedor', 'Um momento de cuidado só para você.'], ['calendar', 'Agendamento fácil', 'Marque seu horário pelo WhatsApp.'], ['smile', 'Ambiente agradável', 'Um espaço confortável para você relaxar.']],
    description: [i => `${i.name} é o seu espaço de beleza e bem-estar. Cada atendimento é pensado para valorizar o que você tem de melhor, com carinho e atenção aos detalhes.`, i => `Cuidar de você é o que nos move. Em ${i.name}, você encontra profissionais atenciosos e um ambiente feito para relaxar.`],
    mission: 'Valorizar a beleza de cada cliente com atendimento cuidadoso e resultados que encantam.', vision: 'Ser referência em beleza e bem-estar, lembrada pelo carinho em cada atendimento.', values: 'Cuidado, qualidade, pontualidade e respeito a cada cliente.',
    faq: [q('Preciso agendar com antecedência?', 'Recomendamos agendar pelo WhatsApp para garantir o melhor horário para você.'), q('Como faço para agendar?', 'Toque no botão do WhatsApp, diga o serviço que deseja e escolha o horário.')],
    finals: [['Que tal reservar um tempo para você?', 'Agende pelo WhatsApp em poucos segundos.'], ['Seu momento de cuidado começa aqui', 'Chame no WhatsApp e escolha o melhor horário.']],
  },
  {
    id: 'barbearia', label: 'Barbearia', listTitle: 'Serviços',
    headlines: [() => 'Corte na régua e barba alinhada', i => `${i.name}: estilo e atendimento de verdade`, i => `A barbearia que você procurava${em(i)}`],
    taglines: ['Profissionais caprichosos, ambiente descontraído e horário marcado sem complicação.', 'Agende pelo WhatsApp e garanta seu horário.', 'Do clássico ao moderno, seu visual em boas mãos.'],
    cta: ['Agendar meu corte', 'Marcar horário', 'Agendar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e quero agendar um horário.',
    benefits: [['award', 'Acabamento caprichado', 'Atenção a cada detalhe do corte e da barba.'], ['calendar', 'Horário marcado', 'Agende pelo WhatsApp sem complicação.'], ['smile', 'Ambiente descontraído', 'Bom papo e clima de casa.'], ['sparkles', 'Do seu jeito', 'Do clássico ao moderno, como você gosta.']],
    description: [i => `Cuidar do visual não precisa ser complicado. ${i.name} une técnica, atenção aos detalhes e um ambiente descontraído para você sair do jeito que gosta.`, i => `Corte, barba e aquele bom papo. Em ${i.name}, cada cliente é atendido com capricho, do começo ao fim.`],
    mission: 'Entregar cortes e barbas caprichados com atendimento de confiança.', vision: 'Ser a barbearia de confiança de quem gosta de se cuidar.', values: 'Capricho, pontualidade, respeito e boa conversa.',
    faq: [q('Preciso marcar horário?', 'Recomendamos agendar pelo WhatsApp para garantir seu horário.'), q('Como faço para agendar?', 'Toque no botão do WhatsApp e escolha o melhor horário para você.')],
    finals: [['Bora dar um trato no visual?', 'Chame no WhatsApp e escolha seu horário.'], ['Seu próximo corte está a um toque', 'Agende agora pelo WhatsApp.']],
  },
  {
    id: 'saude', label: 'Saúde e bem-estar', listTitle: 'Especialidades',
    headlines: [() => 'Cuidado com a sua saúde, com atenção de verdade', i => `${i.name}: saúde com acolhimento`, () => 'Seu bem-estar em boas mãos'],
    taglines: ['Atendimento humanizado, profissionais dedicados e agendamento simples pelo WhatsApp.', 'Tire suas dúvidas e agende seu atendimento pelo WhatsApp.', 'Cuidamos de você com atenção, respeito e responsabilidade.'],
    cta: ['Agendar atendimento', 'Falar com a recepção', 'Agendar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de agendar um atendimento.',
    benefits: [['heart', 'Atendimento humanizado', 'Escuta atenta e cuidado em cada etapa.'], ['shield', 'Responsabilidade', 'Seu cuidado tratado com seriedade.'], ['calendar', 'Agendamento simples', 'Marque seu horário pelo WhatsApp.'], ['users', 'Equipe dedicada', 'Profissionais comprometidos com o seu bem-estar.']],
    description: [i => `${i.name} oferece um atendimento próximo e acolhedor, com foco no seu bem-estar e na sua saúde.`, i => `Sua saúde merece atenção de verdade. Em ${i.name}, você é ouvido com calma e cuidado em cada etapa do atendimento.`],
    mission: 'Promover saúde e bem-estar com atendimento humanizado e responsável.', vision: 'Ser referência em cuidado e confiança para cada paciente.', values: 'Ética, empatia, responsabilidade e respeito.',
    faq: [q('Como agendo um atendimento?', 'Toque no botão do WhatsApp e fale com a nossa equipe. Vamos encontrar o melhor horário para você.'), q('Vocês atendem convênio?', 'Consulte pelo WhatsApp as formas de atendimento disponíveis.')],
    finals: [['Cuide da sua saúde hoje', 'Agende pelo WhatsApp de forma rápida e prática.'], ['Estamos prontos para te atender', 'Fale com a gente pelo WhatsApp.']],
  },
  {
    id: 'fitness', label: 'Academia e esportes', listTitle: 'Planos e aulas',
    headlines: [() => 'Mais saúde, mais energia, mais você', i => `${i.name}: seu treino começa aqui`, () => 'Treine com quem acompanha você de perto'],
    taglines: ['Estrutura, acompanhamento e motivação para você chegar no seu objetivo.', 'Fale com a gente pelo WhatsApp e conheça os planos.', 'Do primeiro treino à meta alcançada, estamos com você.'],
    cta: ['Quero começar', 'Conhecer os planos', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e quero conhecer os planos.',
    benefits: [['zap', 'Mais energia', 'Treinos que cabem na sua rotina.'], ['users', 'Acompanhamento', 'Profissionais que orientam você de perto.'], ['award', 'Foco no resultado', 'Planejamento para você evoluir.'], ['smile', 'Ambiente motivador', 'Clima bom para não desistir.']],
    description: [i => `${i.name} é o lugar para você cuidar do corpo e da mente, com orientação, estrutura e um ambiente que motiva.`, i => `Seu objetivo é a nossa meta. Em ${i.name}, você treina com acompanhamento e encontra a motivação para não parar.`],
    mission: 'Ajudar cada aluno a alcançar seus objetivos com saúde e orientação.', vision: 'Ser a referência de quem quer viver com mais saúde e energia.', values: 'Disciplina, respeito, motivação e cuidado com cada aluno.',
    faq: [q('Posso conhecer o espaço antes?', 'Fale com a gente pelo WhatsApp para saber como conhecer nosso espaço.'), q('Como faço para me matricular?', 'Toque no botão do WhatsApp e explicamos tudo.')],
    finals: [['Seu primeiro passo começa hoje', 'Chame no WhatsApp e conheça nossos planos.'], ['Bora treinar?', 'Fale com a gente pelo WhatsApp.']],
  },
  {
    id: 'hospedagem', label: 'Hospedagem e lazer', listTitle: 'Hospedagem e lazer',
    headlines: [() => 'Descanso, natureza e boas lembranças', i => `${i.name}: seu refúgio para relaxar`, i => `Hospedagem e lazer${em(i)}`],
    taglines: ['Conforto, tranquilidade e um atendimento que faz você querer voltar.', 'Consulte datas e valores direto pelo WhatsApp.', 'O lugar ideal para descansar e aproveitar momentos especiais.'],
    cta: ['Consultar datas', 'Fazer minha reserva', 'Ver disponibilidade'], message: 'Olá! Vim pela página de vocês e gostaria de consultar datas disponíveis.',
    benefits: [['leaf', 'Tranquilidade', 'Um lugar para desacelerar e recarregar.'], ['heart', 'Atendimento acolhedor', 'Você recebido com carinho.'], ['star', 'Conforto', 'Estrutura pensada para o seu descanso.'], ['calendar', 'Reserva fácil', 'Consulte datas pelo WhatsApp.']],
    description: [i => `${i.name} é o lugar para desacelerar, descansar e viver bons momentos com quem você gosta.`, i => `Tranquilidade e conforto em um só lugar. Em ${i.name}, cada estadia é pensada para você aproveitar sem preocupação.`],
    mission: 'Proporcionar descanso e momentos especiais com conforto e acolhimento.', vision: 'Ser o lugar onde as pessoas querem sempre voltar.', values: 'Hospitalidade, cuidado, respeito à natureza e às pessoas.',
    faq: [q('Como faço uma reserva?', 'Fale com a gente pelo WhatsApp informando as datas e o número de pessoas.'), q('Aceitam animais de estimação?', 'Consulte pelo WhatsApp as regras da hospedagem.')],
    finals: [['Sua próxima pausa começa aqui', 'Consulte datas disponíveis pelo WhatsApp.'], ['Que tal uma pausa merecida?', 'Fale com a gente e garanta sua data.']],
  },
  {
    id: 'loja', label: 'Loja e comércio', listTitle: 'Produtos',
    headlines: [() => 'Variedade, qualidade e atendimento de verdade', i => `${i.name}: o que você procura está aqui`, () => 'Compre com quem entende do que vende'],
    taglines: ['Atendimento próximo e produtos escolhidos com cuidado para você.', 'Consulte produtos e disponibilidade pelo WhatsApp.', 'Venha nos visitar ou fale com a gente pelo WhatsApp.'],
    cta: ['Consultar produtos', 'Falar com um vendedor', 'Comprar pelo WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de consultar um produto.',
    benefits: [['star', 'Qualidade', 'Produtos escolhidos com cuidado.'], ['smile', 'Atendimento próximo', 'A gente ajuda você a escolher.'], ['zap', 'Compra fácil', 'Consulte tudo pelo WhatsApp.'], ['heart', 'Feito para você', 'Variedade para o seu dia a dia.']],
    description: [i => `${i.name} reúne produtos escolhidos com cuidado e um atendimento próximo para ajudar você a encontrar o que precisa.`, i => `Mais do que vender, gostamos de atender bem. Em ${i.name}, você encontra variedade e alguém para tirar suas dúvidas.`],
    mission: 'Oferecer produtos de qualidade com atendimento próximo e honesto.', vision: 'Ser a loja de confiança da região.', values: 'Qualidade, transparência e respeito ao cliente.',
    faq: [q('Vocês entregam?', 'Consulte pelo WhatsApp as opções de entrega para a sua região.'), q('Como consulto um produto?', 'Toque no botão do WhatsApp e diga o que você procura.')],
    finals: [['Encontrou o que procurava?', 'Fale com a gente pelo WhatsApp e garanta o seu.'], ['Estamos esperando por você', 'Chame no WhatsApp ou venha nos visitar.']],
  },
  {
    id: 'automotivo', label: 'Automotivo', listTitle: 'Serviços',
    headlines: [() => 'Seu veículo em boas mãos', i => `${i.name}: serviço automotivo de confiança`, i => `Cuidado completo para o seu veículo${em(i)}`],
    taglines: ['Serviço bem feito, orçamento claro e atendimento transparente.', 'Peça seu orçamento pelo WhatsApp.', 'Qualidade e agilidade para você voltar logo para a estrada.'],
    cta: ['Pedir orçamento', 'Agendar serviço', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de um orçamento.',
    benefits: [['wrench', 'Serviço bem feito', 'Atenção técnica em cada etapa.'], ['shield', 'Confiança', 'Transparência do orçamento à entrega.'], ['clock', 'Agilidade', 'Seu veículo pronto o quanto antes.'], ['thumbs', 'Atendimento claro', 'Explicamos tudo antes de fazer.']],
    description: [i => `${i.name} cuida do seu veículo com atenção técnica, orçamento claro e atendimento de confiança.`, i => `Em ${i.name}, você sabe o que vai ser feito antes de começar. Serviço caprichado para você rodar tranquilo.`],
    mission: 'Cuidar de cada veículo com qualidade, transparência e agilidade.', vision: 'Ser a oficina de confiança de cada cliente.', values: 'Honestidade, qualidade e compromisso com o prazo.',
    faq: [q('Como peço um orçamento?', 'Toque no botão do WhatsApp e conte o que o seu veículo precisa.'), q('Preciso agendar?', 'Recomendamos combinar pelo WhatsApp para atender você no melhor horário.')],
    finals: [['Seu veículo merece esse cuidado', 'Peça seu orçamento pelo WhatsApp.'], ['Vamos resolver isso?', 'Chame no WhatsApp agora.']],
  },
  {
    id: 'pet', label: 'Pet', listTitle: 'Serviços',
    headlines: [() => 'Carinho e cuidado para quem você ama', i => `${i.name}: seu pet em boas mãos`, i => `Tudo para o seu pet${em(i)}`],
    taglines: ['Atendimento atencioso e um ambiente pensado para o bem-estar do seu pet.', 'Agende ou tire suas dúvidas pelo WhatsApp.', 'Porque o seu melhor amigo merece o melhor.'],
    cta: ['Agendar pelo WhatsApp', 'Falar com a gente', 'Quero agendar'], message: 'Olá! Vim pela página de vocês e gostaria de agendar um atendimento para o meu pet.',
    benefits: [['heart', 'Muito carinho', 'Seu pet tratado como da família.'], ['shield', 'Cuidado e segurança', 'Atenção em cada detalhe.'], ['calendar', 'Agendamento fácil', 'Marque pelo WhatsApp.'], ['smile', 'Atendimento atencioso', 'Tiramos suas dúvidas com paciência.']],
    description: [i => `${i.name} cuida do seu pet com carinho, atenção e todo o cuidado que ele merece.`, i => `Seu melhor amigo merece o melhor. Em ${i.name}, cada pet é recebido com carinho e muita atenção.`],
    mission: 'Cuidar de cada pet com carinho, responsabilidade e atenção.', vision: 'Ser a escolha de confiança de quem ama seu pet.', values: 'Amor aos animais, cuidado, responsabilidade e respeito.',
    faq: [q('Como agendo um atendimento?', 'Fale com a gente pelo WhatsApp e escolha o melhor horário.'), q('Atendem todos os portes?', 'Consulte pelo WhatsApp e tiramos suas dúvidas.')],
    finals: [['Seu pet vai adorar', 'Chame no WhatsApp e agende agora.'], ['Cuidado de verdade para o seu pet', 'Fale com a gente pelo WhatsApp.']],
  },
  {
    id: 'educacao', label: 'Educação e cursos', listTitle: 'Cursos',
    headlines: [() => 'Aprender pode ser mais leve e eficiente', i => `${i.name}: conhecimento que transforma`, i => `Cursos e aulas${em(i)}`],
    taglines: ['Aulas com acompanhamento de perto e foco no seu desenvolvimento.', 'Fale com a gente pelo WhatsApp e conheça as turmas.', 'Do primeiro passo ao objetivo alcançado, estamos com você.'],
    cta: ['Quero saber mais', 'Conhecer as turmas', 'Falar no WhatsApp'], message: 'Olá! Vim pela página de vocês e gostaria de saber mais sobre os cursos.',
    benefits: [['users', 'Acompanhamento de perto', 'Atenção para cada aluno.'], ['award', 'Foco no resultado', 'Aprendizado com propósito.'], ['heart', 'Ambiente acolhedor', 'Um lugar bom para aprender.'], ['zap', 'Informações rápidas', 'Tire suas dúvidas pelo WhatsApp.']],
    description: [i => `${i.name} acredita que aprender transforma. Aqui, cada aluno é acompanhado de perto para evoluir com confiança.`, i => `Conhecimento com propósito e atenção a cada aluno. Venha conhecer ${i.name}.`],
    mission: 'Transformar vidas por meio do conhecimento, com ensino de qualidade e acolhimento.', vision: 'Ser referência em ensino na região.', values: 'Dedicação, respeito, inovação e compromisso com cada aluno.',
    faq: [q('Como faço a matrícula?', 'Fale com a gente pelo WhatsApp e explicamos todos os passos.'), q('Quais são os horários das turmas?', 'Consulte as turmas disponíveis pelo WhatsApp.')],
    finals: [['Comece hoje a aprender algo novo', 'Chame no WhatsApp e conheça nossas turmas.'], ['Seu próximo passo começa aqui', 'Fale com a gente pelo WhatsApp.']],
  },
  {
    id: 'escritorio', label: 'Escritório e consultoria', listTitle: 'Serviços',
    headlines: [() => 'Soluções claras para você decidir com segurança', i => `${i.name}: atendimento profissional e próximo`, i => `Consultoria de confiança${em(i)}`],
    taglines: ['Atendimento personalizado, linguagem clara e compromisso com o seu resultado.', 'Agende uma conversa pelo WhatsApp.', 'Conte com profissionais dedicados em cada etapa.'],
    cta: ['Agendar uma conversa', 'Falar com um especialista', 'Pedir atendimento'], message: 'Olá! Vim pela página de vocês e gostaria de agendar um atendimento.',
    benefits: [['shield', 'Segurança', 'Orientação responsável em cada etapa.'], ['users', 'Atendimento personalizado', 'Cada caso tratado de forma única.'], ['thumbs', 'Linguagem clara', 'Sem complicação para você entender.'], ['clock', 'Retorno rápido', 'Fale com a gente pelo WhatsApp.']],
    description: [i => `${i.name} oferece atendimento profissional e próximo, com orientação clara para você tomar as melhores decisões.`, i => `Cada cliente tem uma necessidade diferente. Em ${i.name}, você recebe atenção personalizada do começo ao fim.`],
    mission: 'Oferecer soluções seguras e claras, com atendimento próximo e responsável.', vision: 'Ser referência em confiança e qualidade no atendimento.', values: 'Ética, transparência, compromisso e respeito.',
    faq: [q('Como funciona o primeiro atendimento?', 'Fale com a gente pelo WhatsApp, conte sua necessidade e combinamos a melhor forma de atender você.'), q('Atendem on-line?', 'Consulte pelo WhatsApp as opções de atendimento.')],
    finals: [['Vamos conversar?', 'Chame no WhatsApp e agende seu atendimento.'], ['Conte com quem entende', 'Fale com a gente pelo WhatsApp.']],
  },
  {
    id: 'servicos', label: 'Serviços em geral', listTitle: 'Serviços',
    headlines: [() => 'Serviço bem feito, do jeito que você precisa', i => `${i.name}: qualidade e compromisso`, i => `Soluções rápidas${em(i)}`],
    taglines: ['Atendimento rápido, trabalho caprichado e orçamento sem complicação.', 'Peça seu orçamento pelo WhatsApp.', 'Conte com uma equipe comprometida com o seu resultado.'],
    cta: ['Pedir orçamento', 'Falar no WhatsApp', 'Solicitar atendimento'], message: 'Olá! Vim pela página de vocês e gostaria de um orçamento.',
    benefits: [['wrench', 'Trabalho caprichado', 'Atenção aos detalhes em cada serviço.'], ['clock', 'Agilidade', 'Respostas rápidas pelo WhatsApp.'], ['shield', 'Compromisso', 'Combinado é cumprido.'], ['thumbs', 'Atendimento claro', 'Você sabe exatamente o que vai ser feito.']],
    description: [i => `${i.name} resolve o que você precisa com qualidade, compromisso e atendimento próximo.`, i => `Em ${i.name}, cada serviço é feito com atenção aos detalhes e respeito ao seu tempo.`],
    mission: 'Entregar serviços de qualidade com agilidade e compromisso.', vision: 'Ser a primeira escolha de quem precisa de um serviço bem feito.', values: 'Qualidade, honestidade, pontualidade e respeito.',
    faq: [q('Como peço um orçamento?', 'Toque no botão do WhatsApp e conte o que você precisa. Respondemos o mais rápido possível.'), q('Atendem a minha região?', 'Consulte pelo WhatsApp a área de atendimento.')],
    finals: [['Precisa de ajuda?', 'Fale agora com a gente pelo WhatsApp.'], ['Vamos resolver isso juntos?', 'Peça seu orçamento pelo WhatsApp.']],
  },
];

const BY_TYPE: [SegmentId, RegExp][] = [
  ['barbearia', /barber/],
  ['pet', /pet_|veterinar|animal/],
  ['beleza', /beauty|hair|nail|spa|makeup|cosmetic|skin_care|tanning|massage|wax/],
  ['gastronomia', /restaurant|cafe|coffee|bakery|bar$|^bar_|pub|pizza|food|meal|ice_cream|dessert|confection|deli|sandwich|steak|sushi|brunch|juice|candy|chocolate|winery|brewery|butcher|acai/],
  ['saude', /dentist|doctor|hospital|clinic|physiother|health|medical|pharmac|drugstore|psycholog|chiropract|optic|nutrition|laborator|wellness/],
  ['fitness', /gym|fitness|sport|yoga|pilates|martial|dance|swim|athletic|crossfit|tennis|golf|stadium/],
  ['hospedagem', /lodging|hotel|motel|inn$|hostel|guest_house|bed_and_breakfast|campground|camping|resort|farmstay|cottage|chalet|rv_park|park$|tourist|amusement|water_park|event_venue|banquet|wedding/],
  ['automotivo', /car_|auto|tire|motorcycle|gas_station|truck|vehicle/],
  ['educacao', /school|university|college|academy|library|tutor|education|training|language|driving_school/],
  ['escritorio', /lawyer|legal|accounting|accountant|insurance|real_estate|consult|finance|bank|notary|agency|corporate|marketing/],
  ['loja', /store|shop|market|supermarket|mall|florist|jewel|furniture|hardware|pharmacy|book|clothing|shoe|electronics|gift|home_goods|liquor|wholesaler|boutique/],
  ['servicos', /plumber|electrician|locksmith|roofing|painter|contractor|moving|laundry|cleaning|repair|storage|courier|travel|photograph|printing|tailor|funeral|church|association|service/],
];

// Ramo pelo tipo do Google (mais específico que o segmento). Ordem importa: barbearia antes de cabelo etc.
const NICHE_BY_TYPE: [NicheId, RegExp][] = [
  ['barbearia', /barber/],
  ['unhas', /nail|eyelash|eyebrow|lash/],
  ['salao', /hair/],
  ['estetica', /spa$|^spa|skin_care|beautician|massage|wax|sauna|wellness_center|tanning|beauty_salon/],
  ['petshop', /pet_store|pet_groom|pet_care|pet_shop/],
  ['veterinaria', /veterinar|animal_hospital/],
  ['dentista', /dentist|dental/],
  ['terapias', /physiother|psycholog|nutrition|chiropract|psychiatr|speech_therap|occupational_therap|acupunct/],
  ['pilates', /yoga|pilates/],
  ['academia', /gym|fitness|crossfit|martial|boxing/],
  ['lavacar', /car_wash|car_detail/],
  ['carros', /car_dealer|used_car|auto_dealer|car_rental|motorcycle_dealer/],
  ['oficina', /car_repair|auto_parts|tire|auto_repair|mechanic|car_service|oil_change|motorcycle_repair/],
  ['imobiliaria', /real_estate|realtor|property|housing/],
  ['corrida', /running|sports_coach|athletic_club/],
  ['jardinagem', /florist|garden|landscap|plant_nursery|lawn/],
  ['assistencia', /cell_phone|electronics|computer|phone_repair|electronics_repair/],
  ['acai', /ice_cream|acai|dessert|candy|confection|chocolate|juice|frozen_yogurt|donut/],
  ['panificadora', /bakery|bread/],
  ['naturais', /health_food|organic|natural_food|vitamin|supplement|bulk_food/],
  ['cafeteria', /cafe|coffee|pastry|tea_house|cake/],
  ['pizzaria', /pizza|hamburger|burger/],
  ['adega', /liquor|wine|beer_store|brewery|winery/],
  ['restaurante', /restaurant|meal_|food_court|diner|buffet|sandwich|steak|barbecue|lunch/],
  ['moda', /clothing|fashion|boutique|bridal|lingerie|womens_clothing|mens_clothing/],
  ['loja', /shoe|gift|jewel|accessor|department_store|bag|textile/],
];
export function detectNiche(types: string[]): NicheId | null {
  const list = types.filter(Boolean).map(t => t.toLowerCase());
  for (const [niche, re] of NICHE_BY_TYPE) if (list.some(t => re.test(t))) return niche;
  return null;
}

export function detectSegment(types: string[]): SegmentId {
  const list = types.map(t => t.toLowerCase());
  for (const [seg, re] of BY_TYPE) if (list.some(t => re.test(t))) return seg;
  return 'servicos';
}
export const segmentOf = (id: SegmentId) => SEGMENTS.find(s => s.id === id) ?? SEGMENTS[SEGMENTS.length - 1];

// "R. X, 123 - Centro, Campo Largo - PR, 83601-000, Brasil" -> "Campo Largo"
export function cityFrom(address: string): string {
  const all = [...(address || '').matchAll(/(?:^|,)\s*([^,]+?)\s*-\s*([A-Z]{2})\b/g)];
  return all.length ? all[all.length - 1][1].replace(/^.*\s-\s/, '').trim() : '';
}

const DAYS: [RegExp, string][] = [[/^seg/i, 'Seg'], [/^ter/i, 'Ter'], [/^qua/i, 'Qua'], [/^qui/i, 'Qui'], [/^sex/i, 'Sex'], [/^s[áa]b/i, 'Sáb'], [/^dom/i, 'Dom'], [/^mon/i, 'Seg'], [/^tue/i, 'Ter'], [/^wed/i, 'Qua'], [/^thu/i, 'Qui'], [/^fri/i, 'Sex'], [/^sat/i, 'Sáb'], [/^sun/i, 'Dom']];
// ["segunda-feira: 08:00 – 18:00", …] -> "Seg a sex: 08:00–18:00 · Sáb: 08:00–12:00 · Dom: fechado"
export function hoursSummary(lines: string[]): string {
  const rows = lines.map(l => {
    const i = l.indexOf(':');
    const day = i > 0 ? DAYS.find(([re]) => re.test(l.slice(0, i).trim()))?.[1] : undefined;
    const time = (i > 0 ? l.slice(i + 1) : l).trim().replace(/\s*[–-]\s*/g, '–').replace(/^fechado$/i, 'fechado').replace(/^closed$/i, 'fechado').replace(/^atendimento 24 horas$/i, '24 horas').replace(/^open 24 hours$/i, '24 horas');
    return day ? { day, time } : null;
  }).filter(Boolean) as { day: string; time: string }[];
  if (!rows.length) return '';
  if (rows.every(r => r.time === rows[0].time)) return `Todos os dias: ${rows[0].time}`;
  const groups: { from: string; to: string; time: string }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.time === r.time) last.to = r.day; else groups.push({ from: r.day, to: r.day, time: r.time });
  }
  return groups.map(g => `${g.from === g.to ? g.from : `${g.from} a ${g.to.toLowerCase()}`}: ${g.time}`).join(' · ').slice(0, 300);
}

export function instagramHandle(value: string): string {
  const v = value.trim();
  if (!v) return '';
  const m = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i);
  const h = m ? m[1] : v.replace(/^@/, '').split(/[/?#\s]/)[0];
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `@${h}` : '';
}

const fmtRating = (r: number) => r.toFixed(1).replace('.', ',');

// Textos gerados para o segmento (ou para o ramo, quando informado). `variant` troca as frases ("Gerar outra versão").
export function generateTexts(segId: SegmentId, info: Info, variant = 0, niche?: NicheId | null): Partial<MiniContent> {
  const base = segmentOf(segId);
  const nt = niche ? NICHE_TEXTS[niche] : null;
  const s = nt ? { ...base, ...nt, benefits: nt.benefits as B[], listTitle: nicheById(niche)?.listTitle ?? base.listTitle } : base;
  const pick = <T,>(arr: T[], k = 0) => arr[(variant + k) % arr.length];
  const goodRating = info.rating != null && info.rating >= 4.5 && (info.ratingCount ?? 0) >= 10;
  const taglines = goodRating ? [`Nota ${fmtRating(info.rating!)} no Google, com ${info.ratingCount} avaliações de clientes.`, ...s.taglines] : s.taglines;
  const faq: Faq[] = [s.faq[0]];
  if (info.address) faq.push(q('Onde vocês ficam?', `Estamos em ${info.address}. Toque em "Como chegar" para abrir o mapa.`));
  if (info.hours) faq.push(q('Qual é o horário de atendimento?', `${info.hours}.`));
  faq.push(s.faq[1]);
  const [finalTitle, finalText] = pick(s.finals);
  return {
    headline: pick(s.headlines)(info).slice(0, 140),
    tagline: pick(taglines).slice(0, 200),
    ctaText: pick(s.cta),
    ctaMessage: s.message,
    benefits: s.benefits.map(([icon, title, text]) => ({ id: uid(), icon, title, text })),
    description: pick(s.description)(info),
    mission: s.mission, vision: s.vision, values: s.values,
    faq: faq.map(f => ({ ...f, id: uid() })),
    finalTitle, finalText,
    listTitle: s.listTitle,
  };
}

// Dados reais vindos do Google (não mudam ao gerar outra versão).
export function googleData(p: GooglePlace): Partial<MiniContent> {
  const out: Partial<MiniContent> = { name: p.name };
  if (p.address) out.address = p.address;
  if (p.phone) out.phone = p.phone;
  if (p.website) out.website = p.website;
  if (p.mapsUri) out.maps = p.mapsUri;
  if (p.reviewUri) out.review = p.reviewUri;
  const hours = hoursSummary(p.hours);
  if (hours) out.hours = hours;
  const stats: Stat[] = [];
  if (p.rating != null && (p.ratingCount ?? 0) >= 5) {
    stats.push({ id: uid(), value: `${fmtRating(p.rating)} ★`, label: 'nota no Google' });
    stats.push({ id: uid(), value: `+${p.ratingCount}`, label: 'avaliações no Google' });
  }
  if (stats.length) out.stats = stats;
  const quotes: Testimonial[] = p.reviews
    .filter(r => r.rating >= 4 && r.text.trim().length >= 20)
    .slice(0, 5)
    .map(r => ({ id: uid(), name: r.author.slice(0, 60), text: r.text.trim().slice(0, 400), stars: Math.round(r.rating), source: 'google' as const }));
  if (quotes.length) out.testimonials = quotes;
  return out;
}

export function infoFrom(c: Pick<MiniContent, 'name' | 'address' | 'hours'>, p?: GooglePlace | null): Info {
  return { name: (p?.name || c.name || 'Sua empresa').trim(), city: cityFrom(p?.address || c.address), address: p?.address || c.address, hours: p ? hoursSummary(p.hours) : c.hours, rating: p?.rating ?? null, ratingCount: p?.ratingCount ?? null };
}

export const slugFor = (name: string) => slugify(name);
