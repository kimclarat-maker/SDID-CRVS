import { PlatformConfig } from "@/types/PlatformConfig";
import { genericDeploymentConfig } from "@/config/deployments/generic.config";
import { rwandaDeploymentConfig } from "@/config/deployments/rwanda.config";

const deploymentPacks: Record<string, PlatformConfig> = {
  generic: genericDeploymentConfig,
  rwanda: rwandaDeploymentConfig,
};

const activeDeployment =
  (typeof window !== "undefined" &&
    (window as unknown as { ________ENV__?: { VITE_DEPLOYMENT?: string } })
      .________ENV__?.VITE_DEPLOYMENT) ||
  import.meta.env?.["VITE_DEPLOYMENT"] ||
  "generic";

export const platformConfig: PlatformConfig =
  deploymentPacks[activeDeployment] ?? genericDeploymentConfig;

export const getEnabledServiceIds = (): string[] =>
  platformConfig.services.filter((service) => service.enabled).map((s) => s.id);

export const isServiceEnabled = (serviceId: string): boolean =>
  platformConfig.services.some(
    (service) => service.id === serviceId && service.enabled
  );
