import { CheckCircle, TrendingUp, Sparkles, Globe } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: CheckCircle,
      title: "Redução de faltas e esquecimentos",
      description: "Notificações automáticas por e-mail reduzem drasticamente o número de clientes faltosos, aumentando sua receita."
    },
    {
      icon: TrendingUp,
      title: "Mais organização e profissionalismo",
      description: "Tenha controle total da agenda, horários e serviços. Transmita profissionalismo e confiança aos seus clientes."
    },
    {
      icon: Sparkles,
      title: "Experiência moderna para o cliente",
      description: "Ofereça uma experiência digital moderna e conveniente, permitindo agendamentos a qualquer hora e lugar."
    },
    {
      icon: Globe,
      title: "Facilidade de uso - 100% online",
      description: "Sem instalação, sem complicações. Acesse de qualquer dispositivo com internet. Simples e eficiente."
    }
  ];

  return (
    <section id="beneficios" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Transforme seu negócio com o Avisei
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra como nossa solução pode revolucionar a gestão de agendamentos do seu estabelecimento
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-6 bg-card rounded-xl shadow-card hover:shadow-elegant transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-button">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;