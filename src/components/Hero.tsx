import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dashboard.jpg";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              O sistema de agendamento com{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                confirmações automáticas
              </span>{" "}
              por e-mail
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Organize seus horários e evite esquecimentos com o Avisei. 
              Uma solução moderna e profissional para seu estabelecimento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                Comece agora
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver demonstração
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>14 dias grátis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative">
              <img
                src={heroImage}
                alt="Dashboard do sistema Avisei"
                className="w-full h-auto rounded-2xl shadow-elegant animate-float"
              />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-elegant">
                <span className="text-white font-bold text-xl">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;