"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Order = {
  id: string;
  number: string;
  publicToken: string;
  maintenanceType: string;
  maintenanceTypeOther?: string | null;
  entryAt: Date;
  items: { label: string; quantity: number }[];
  customer: {
    name: string;
    phone: string | null;
    whatsapp?: string | null;
  };
  equipment: {
    brand?: string | null;
    model: string;
    serialNumber?: string | null;
  };
};

export function WhatsAppShareButton({ order }: { order: Order }) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleShare = async () => {
    if (!order.customer.phone && !order.customer.whatsapp) {
      toast("Cliente não possui número de telefone registrado", "error");
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const whatsappLink = buildWhatsAppLink(
        {
          number: order.number,
          publicToken: order.publicToken,
          customer: order.customer,
          entryAt: order.entryAt,
          maintenanceType: order.maintenanceType,
          maintenanceTypeOther: order.maintenanceTypeOther,
          items: order.items,
          equipment: order.equipment,
        },
        baseUrl,
      );

      if (!whatsappLink) {
        toast("Não foi possível gerar o link do WhatsApp", "error");
        return;
      }

      // Record the share action
      const formData = new FormData();
      formData.set(
        "data",
        JSON.stringify({
          orderId: order.id,
          message: "Link compartilhado via WhatsApp",
        }),
      );

      // Send to server action (fire and forget)
      const response = await fetch("/_actions?action=shareOrderViaWhatsApp", {
        method: "POST",
        body: formData,
      }).catch(() => null);

      // Open WhatsApp link
      window.open(whatsappLink, "_blank", "noopener,noreferrer");
      toast("Abrindo WhatsApp...", "success");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isLoading || (!order.customer.phone && !order.customer.whatsapp)}
      variant="secondary"
      size="sm"
      className="gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      {isLoading ? "Abrindo..." : "Compartilhar via WhatsApp"}
    </Button>
  );
}
