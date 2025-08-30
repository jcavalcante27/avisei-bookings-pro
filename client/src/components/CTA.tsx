import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Comece agora e transforme seus agendamentos
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de estabelecimentos que já revolucionaram 
            sua gestão de agendamentos com o Avisei
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Button 
              variant="secondary" 
              size="lg" 
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100 font-semibold"
            >
              <Clock className="w-5 h-5 mr-2" />
              Testar grátis por 14 dias
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <p className="text-sm opacity-75">
            Sem cartão de crédito • Cancele quando quiser • Suporte especializado
          </p>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-sm opacity-75">Estabelecimentos atendidos</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-sm opacity-75">Redução de faltas</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-75">Agendamentos online</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;