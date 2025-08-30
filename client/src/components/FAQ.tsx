import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer: "Você tem 14 dias gratuitos para testar todas as funcionalidades do Avisei. Não é necessário cartão de crédito para começar. Após o período, você pode escolher continuar com o plano Pro ou cancelar sem custos."
    },
    {
      question: "Preciso instalar algo?",
      answer: "Não! O Avisei é 100% online. Você acessa tudo através do navegador de qualquer dispositivo. Seus clientes também podem agendar pelo celular, tablet ou computador."
    },
    {
      question: "É possível cancelar a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. O cancelamento é processado imediatamente e você mantém acesso até o final do período pago."
    },
    {
      question: "O que acontece após os 14 dias?",
      answer: "Após o período de teste, você pode escolher assinar o Plano Pro por R$ 97/mês ou não fazer nada e sua conta será automaticamente desativada. Não cobramos nada sem sua autorização."
    },
    {
      question: "Como funcionam as notificações por e-mail?",
      answer: "O sistema envia automaticamente confirmações de agendamento, lembretes antes da consulta e notificações de cancelamento/reagendamento tanto para você quanto para seus clientes. Tudo configurável conforme sua necessidade."
    }
  ];

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Avisei e como ele pode ajudar seu negócio
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-lg shadow-card px-6 border-none"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;