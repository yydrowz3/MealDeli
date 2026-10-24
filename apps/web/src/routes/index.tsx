import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../app";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <LandingPage />;
}
