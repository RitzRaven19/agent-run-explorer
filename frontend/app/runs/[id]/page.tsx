import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ErrorPanel from "@/components/ErrorPanel";
import ExplainRun from "@/components/ExplainRun";
import RunErrorBox from "@/components/RunErrorBox";
import RunHeader from "@/components/RunHeader";
import RunWarnings from "@/components/RunWarnings";
import StepsTimeline from "@/components/StepsTimeline";
import { describeError, fetchRun } from "@/lib/api";
import { backToRunsHref } from "@/lib/filters";
import type { Run } from "@/lib/types";

// cache() shares one result per request, so the page and its title cost a single backend call.
const loadRun = cache(fetchRun);

export async function generateMetadata({ params }: PageProps<"/runs/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    return { title: (await loadRun(id)) === null ? "Run not found" : id };
  } catch {
    // A title must never fail the page: when the backend cannot be asked, the id is still correct.
    return { title: id };
  }
}

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="self-start text-[13px] text-muted">
      ← Back to runs
    </Link>
  );
}

export default async function RunPage({ params, searchParams }: PageProps<"/runs/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;
  // A repeated ?from= arrives as an array; only a single value is used.
  const backHref = backToRunsHref(typeof from === "string" ? from : undefined);

  let run: Run | null;
  try {
    run = await loadRun(id);
  } catch (error) {
    return (
      <div className="flex flex-col gap-[22px] pt-10 pb-[72px]">
        <BackLink href={backHref} />
        <ErrorPanel title="This run could not be loaded" message={describeError(error)} />
      </div>
    );
  }
  // Outside the try on purpose: notFound() works by throwing, and the catch above would swallow it.
  if (run === null) notFound();

  return (
    <div className="flex flex-col gap-[22px] pt-10 pb-[72px]">
      <BackLink href={backHref} />
      <RunHeader run={run} />
      <RunWarnings warnings={run.warnings} />
      <RunErrorBox run={run} />
      {/* key: a different run gets a fresh component, so an old explanation never shows on the new page. */}
      <ExplainRun key={run.id} runId={run.id} />
      <StepsTimeline run={run} />
    </div>
  );
}
