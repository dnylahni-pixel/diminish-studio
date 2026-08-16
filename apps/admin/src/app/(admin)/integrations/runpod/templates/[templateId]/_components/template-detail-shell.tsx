"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/actions";
import {
  Card,
  Badge,
  DescriptionList,
  CodeBlock,
  Divider,
} from "@/components/ui/data-display";
import { Heading, Text, Code } from "@/components/ui/typography";
import { Stack, Inline } from "@/components/ui/layout";
import { formatGb } from "@/integrations/runpod/formatters";
import type { TemplateDetail } from "@/integrations/runpod/types";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

interface TemplateDetailShellProps {
  template: TemplateDetail;
}

/* ---------------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------------- */

function getTemplateTypeLabel(template: TemplateDetail): string {
  if (template.isServerless) return "Serverless";
  if (template.isRunpod) return "Runpod";
  return "Standard";
}

function getTemplateTypeTone(template: TemplateDetail): "info" | "primary" | "neutral" {
  if (template.isServerless) return "info";
  if (template.isRunpod) return "primary";
  return "neutral";
}

function formatPorts(ports: string | null): string {
  if (!ports) return "—";
  return ports;
}

function formatDockerArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "—";
  return arr.join(" ");
}

function formatEnvCount(env: Record<string, string>): number {
  return Object.keys(env).length;
}

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function TemplateDetailShell({ template }: TemplateDetailShellProps) {
  const envCount = formatEnvCount(template.env);
  const hasReadme = !!template.readme;

  return (
    <Stack gap="lg">
      {/* Back link */}
      <Link
        href="/integrations/runpod/templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to templates
      </Link>

      {/* Header */}
      <div>
        <Inline gap="md" align="center" justify="between">
          <div>
            <Inline gap="md" align="center">
              <Heading level={3}>{template.name ?? `Template ${template.id.slice(0, 8)}`}</Heading>
              <Badge tone={getTemplateTypeTone(template)} size="md">
                {getTemplateTypeLabel(template)}
              </Badge>
            </Inline>
            <Text size="sm" tone="muted" className="mt-1">
              {template.id}
            </Text>
          </div>
          <Link
            href="/integrations/runpod/templates"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            All templates
          </Link>
        </Inline>
      </div>

      {/* Image name */}
      <div>
        <Text size="sm" tone="muted" weight="medium">
          Image
        </Text>
        <Code className="mt-1 inline-block">{template.imageName ?? "—"}</Code>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              Container disk
            </Text>
            <Text weight="semibold">{formatGb(template.containerDiskInGb)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              Volume
            </Text>
            <Text weight="semibold">{formatGb(template.volumeInGb)}</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap="xs">
            <Text size="sm" tone="muted">
              Category
            </Text>
            <Text weight="semibold">{template.category ?? "—"}</Text>
          </Stack>
        </Card>
      </div>

      {/* Details Card */}
      <Card padding="lg">
        <Heading level={4}>Details</Heading>
        <Divider className="my-4" />
        <DescriptionList
          items={[
            { term: "Template ID", description: template.id },
            { term: "Name", description: template.name ?? "—" },
            { term: "Image", description: template.imageName ?? "—" },
            { term: "Category", description: template.category ?? "—" },
            { term: "Container disk", description: formatGb(template.containerDiskInGb) },
            { term: "Volume", description: formatGb(template.volumeInGb) },
            { term: "Volume mount path", description: template.volumeMountPath ?? "—" },
            { term: "Docker entrypoint", description: formatDockerArray(template.dockerEntrypoint) },
            { term: "Docker start command", description: formatDockerArray(template.dockerStartCmd) },
            { term: "Ports", description: formatPorts(template.ports) },
            { term: "Registry auth ID", description: template.containerRegistryAuthId ?? "—" },
            { term: "Type", description: getTemplateTypeLabel(template) },
          ]}
        />
      </Card>

      {/* Environment variables Card */}
      {envCount > 0 && (
        <Card padding="lg">
          <Heading level={4}>Environment variables</Heading>
          <Divider className="my-4" />
          <DescriptionList
            items={Object.entries(template.env).map(([key, value]) => ({
              term: key,
              description: value,
            }))}
          />
        </Card>
      )}

      {/* README Card */}
      {hasReadme && (
        <Card padding="lg">
          <Heading level={4}>README</Heading>
          <Divider className="my-4" />
          <CodeBlock code={template.readme!} language="markdown" />
        </Card>
      )}
    </Stack>
  );
}
