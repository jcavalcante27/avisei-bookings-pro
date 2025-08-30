import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">Avisei</span>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("funcionalidades")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection("beneficios")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection("planos")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection("depoimentos")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Depoimentos
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dúvidas
            </button>
          </nav>

          <div className="hidden md:block">
            <Button variant="cta" size="lg">
              Testar por 14 dias grátis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection("funcionalidades")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection("beneficios")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("planos")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Planos
              </button>
              <button
                onClick={() => scrollToSection("depoimentos")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Depoimentos
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Dúvidas
              </button>
              <Button variant="cta" className="w-full mt-4">
                Testar por 14 dias grátis
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;