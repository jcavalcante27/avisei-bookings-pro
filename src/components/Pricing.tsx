import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const Pricing = () => {
  return (
    <section id="planos" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que se adaptam ao seu negócio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e experimente todos os recursos por 14 dias
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Teste Gratuito */}
          <div className="p-8 bg-card rounded-2xl shadow-card border border-border">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Teste Gratuito</h3>
              <div className="text-4xl font-bold text-foreground mb-2">
                R$ 0
                <span className="text-lg font-normal text-muted-foreground">/14 dias</span>
              </div>
              <p className="text-muted-foreground">Experimente todos os recursos</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Agendamentos ilimitados</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Notificações por e-mail</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Painel administrativo</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Suporte por e-mail</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full" size="lg">
              Começar teste grátis
            </Button>
          </div>

          {/* Plano Pro */}
          <div className="relative p-8 bg-gradient-primary rounded-2xl shadow-elegant text-white">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white text-primary px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>Mais Popular</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Plano Pro</h3>
              <div className="text-4xl font-bold mb-2">
                R$ 97
                <span className="text-lg font-normal opacity-80">/mês</span>
              </div>
              <p className="opacity-80">Solução completa para seu negócio</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Agendamentos ilimitados</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Notificações automáticas por e-mail</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Múltiplos profissionais</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Painel de comissões</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Relatórios avançados</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-white" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            <Button variant="secondary" className="w-full bg-white text-primary hover:bg-gray-100" size="lg">
              Assinar agora
            </Button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Todos os planos incluem integração com Stripe para pagamentos seguros
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <span>✓ Sem fidelidade</span>
            <span>✓ Cancele quando quiser</span>
            <span>✓ Suporte especializado</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;