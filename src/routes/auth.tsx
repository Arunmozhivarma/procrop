import { createFileRoute } from "@tanstack/react-router";
import { AuthView } from "@/features/auth/AuthView";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ProCrop Farmer Access" },
      {
        name: "description",
        content:
          "Sign in or register for ProCrop to monitor crop health, soil condition and pest risk across your fields.",
      },
      { property: "og:title", content: "Sign in — ProCrop Farmer Access" },
      {
        property: "og:description",
        content:
          "Farmer registration and login for the ProCrop agricultural intelligence platform.",
      },
    ],
  }),
  component: AuthView,
});
