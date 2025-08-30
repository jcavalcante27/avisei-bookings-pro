import { Calendar, Mail, Clock, BarChart3, Users, Settings } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamentos online em tempo real",
      description: "Sistema sincronizado que permite agendamentos 24/7 com disponibilidade em tempo real."
    },
    {
      icon: Mail,
      title: "Notificações automáticas por e-mail",
      description: "Confirmações e lembretes enviados automaticamente para cliente e estabelecimento."
    },
    {
      icon: Clock,
      title: "Reagendamento e cancelamento",
      description: "Regras configuráveis para reagendamentos e cancelamentos com total flexibilidade."
    },
    {
      icon: Settings,
      title: "Painel administrativo completo",
      description: "Controle total de horários, profissionais e serviços em uma interface intuitiva."
    },
    {
      icon: Users,
      title: "Cadastro de comissões",
      description: "Gerencie comissões por profissional de forma automática e transparente."
    },
    {
      icon: BarChart3,
      title: "Dashboard e relatórios",
      description: "Acompanhe atendimentos, receitas e performance com relatórios detalhados."
    }
  ];

  return (
    <section id="funcionalidades" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Funcionalidades completas para seu negócio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para modernizar seus agendamentos em uma única plataforma
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;