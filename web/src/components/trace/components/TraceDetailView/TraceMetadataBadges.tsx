/**
 * TraceMetadataBadges - Extracted badge components for trace metadata
 *
 * Following the pattern from ObservationDetailView/ObservationMetadataBadgesSimple.tsx
 * Each badge handles its own null check and returns null when data is unavailable.
 */

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { useI18n } from "@/src/i18n/provider";

export function SessionBadge({
  sessionId,
  projectId,
}: {
  sessionId: string | null;
  projectId: string;
}) {
  const { t } = useI18n();
  if (!sessionId) return null;

  const text = t("Session: {id}").replace("{id}", sessionId);

  return (
    <Link
      href={`/project/${projectId}/sessions/${encodeURIComponent(sessionId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function UserIdBadge({
  userId,
  projectId,
}: {
  userId: string | null;
  projectId: string;
}) {
  const { t } = useI18n();
  if (!userId) return null;

  const text = t("User ID: {id}").replace("{id}", userId);

  return (
    <Link
      href={`/project/${projectId}/users/${encodeURIComponent(userId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function TargetTraceBadge({
  targetTraceId,
  projectId,
}: {
  targetTraceId: string | null;
  projectId: string;
}) {
  const { t } = useI18n();
  if (!targetTraceId) return null;

  const text = t("Target Trace: {id}").replace("{id}", targetTraceId);

  return (
    <Link
      href={`/project/${projectId}/traces/${encodeURIComponent(targetTraceId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function EnvironmentBadge({
  environment,
}: {
  environment: string | null;
}) {
  if (!environment) return null;
  return <Badge variant="tertiary">Env: {environment}</Badge>;
}

export function ReleaseBadge({ release }: { release: string | null }) {
  if (!release) return null;
  return <Badge variant="tertiary">Release: {release}</Badge>;
}

export function VersionBadge({ version }: { version: string | null }) {
  if (!version) return null;
  return <Badge variant="tertiary">Version: {version}</Badge>;
}
