import type { DeliveryType } from "../../lib/database.types";

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  quiz: "Quiz",
  exam: "Prova",
  aps: "APS",
  project: "Projeto",
  activity: "Atividade",
  notice: "Aviso",
};

export const deliveryTypes = Object.keys(deliveryTypeLabels) as DeliveryType[];
