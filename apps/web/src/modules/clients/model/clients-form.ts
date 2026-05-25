import type { Client, CreateClientPayload } from "@work-planner/shared";

export const emptyClientFormValues: CreateClientPayload = {
  name: "",
  label: "",
  city: "",
  phone: "",
  telegram: "",
  vk: "",
  instagram: "",
  note: "",
  customData: {}
};

export const mapClientToFormValues = (client: Client): CreateClientPayload => {
  return {
    name: client.name,
    label: client.label,
    city: client.city,
    phone: client.phone,
    telegram: client.telegram,
    vk: client.vk,
    instagram: client.instagram,
    note: client.note,
    customData: client.customData
  };
}
