"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TriangleAlert,
  PartyPopper,
  Lock,
  SkipForward,
  MessageCircle,
  Settings,
} from "lucide-react"
import { SwerveAlignAnimation } from "@/components/swerve-align-animation"
import { ModuleLocationDiagram } from "@/components/module-location-diagram"
import { ControllerAnimation } from "@/components/controller-animation"
import { GyroCheckAnimation } from "@/components/gyro-check-animation"
import { SpinTestAnimation } from "@/components/spin-test-animation"
import { FieldOrientationAnimation } from "@/components/field-orientation-animation"
import { JsonDiff } from "@/components/json-diff"
import { Step } from "@/components/tuning-step"
import { ModuleMotorAnimation } from "@/components/module-motor-animation"
import { FlappyRivetGame } from "@/components/flappy-rivet-game"
import { ThemeToggle } from "@/components/theme-toggle"
import { PrintButton } from "@/components/print-button"
import { cn } from "@/lib/utils"
import { withBasePath } from "@/lib/base-path"
import { SiteFooter } from "@/components/site-footer"
import { LiveProvider, useLive } from "@/components/live/live-context"
import { LiveConnectionCard, LiveModeToggle } from "@/components/live/live-connection"
import { LiveTuningInvite, LiveTuningPanel } from "@/components/live/live-panel"
import { LiveFinish, LiveStopBar, LiveTelemetryCheck } from "@/components/live/live-steps"

const EXAMPLE_PROJECT_URL = "https://github.com/Yet-Another-Software-Suite/YAGSL/tree/main/examples"

function ExampleProjectNote() {
  return (
    <Alert>
      <AlertDescription>
        All of the tuning steps below follow the{" "}
        <Link
          href={EXAMPLE_PROJECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
        >
          YAGSL example project
          <ExternalLink className="h-3 w-3" />
        </Link>
        .
      </AlertDescription>
    </Alert>
  )
}

function ExternalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </Link>
  )
}

function PidTuningLinks() {
  return (
    <>
      Not sure how to tune a PID loop? WPILib's{" "}
      <ExternalDocLink href="https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/tuning-flywheel.html">
        flywheel tuning guide
      </ExternalDocLink>{" "}
      walks through the same method used here for the drive PID, and the{" "}
      <ExternalDocLink href="https://docs.wpilib.org/en/stable/docs/software/advanced-controls/introduction/tuning-turret.html">
        turret tuning guide
      </ExternalDocLink>{" "}
      covers the azimuth/angle PID.
    </>
  )
}

/** The live tuning steps: with Live mode on, the tuning panel stands in for the steps between setup and finish. */
function liveTuningStepIds(idPrefix: string, live: boolean): string[] {
  return (
    live
      ? ["setup", "tune", "finish"]
      : ["setup", "enable", "azimuth-enable", "azimuth-tune", "drive-enable", "drive-tune", "inplace", "finish"]
  ).map((suffix) => `${idPrefix}-${suffix}`)
}

function GuideFigure({
  src,
  alt,
  width,
  height,
  caption,
  small,
  printSrc,
  printCaption,
}: {
  src: string
  alt: string
  width: number
  height: number
  caption?: ReactNode
  small?: boolean
  /** A still to print in place of an animated GIF, which would print only its first frame. Same size as src. */
  printSrc?: string
  /** The caption for printSrc, when the animation's caption describes more than that one frame. */
  printCaption?: ReactNode
}) {
  return (
    <figure className={small ? "mt-2 max-w-sm" : "mt-2"}>
      <Image
        src={withBasePath(src)}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        // Loaded up front: a lazy image that hasn't been scrolled to prints as an empty box.
        loading="eager"
        className={printSrc ? "w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10 print:hidden" : "w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10"}
      />
      {printSrc && (
        <Image
          src={withBasePath(printSrc)}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          loading="eager"
          className="hidden w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10 print:block"
        />
      )}
      {caption && (
        <figcaption className={printCaption ? "mt-1 text-xs text-muted-foreground print:hidden" : "mt-1 text-xs text-muted-foreground"}>
          {caption}
        </figcaption>
      )}
      {printCaption && <figcaption className="mt-1 hidden text-xs text-muted-foreground print:block">{printCaption}</figcaption>}
    </figure>
  )
}

function LiveTuningSteps({
  real,
  idPrefix,
  checkedSteps,
  toggleStep,
}: {
  real: boolean
  idPrefix: string
  checkedSteps: Set<string>
  toggleStep: (id: string, checked: boolean) => void
}) {
  const stepId = (suffix: string) => `${idPrefix}-${suffix}`
  const checked = (suffix: string) => checkedSteps.has(stepId(suffix))
  const onChange = (suffix: string) => (c: boolean) => toggleStep(stepId(suffix), c)
  const done = (suffix: string) => () => toggleStep(stepId(suffix), true)
  const live = useLive()
  const doneTuning = () => {
    toggleStep(stepId("tune"), true)
    document.getElementById(stepId("finish"))?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <>
      <LiveTuningInvite real={real} />
      <LiveConnectionCard real={real} />
      <Step
        id={stepId("setup")}
        title="Wire up telemetry so the drive/azimuth PID gains become live-tunable over NetworkTables."
        detail={
          <>
            <p>
              YAGSL runs on{" "}
              <ExternalDocLink href="https://yams.yassrobotics.com/details/swerve-drive">YAMS</ExternalDocLink>{" "}
              under the hood now, so if the <NTPath>SwerveDriveConfig</NTPath> you build in code and pass to{" "}
              <NTPath>SwerveParser.createSwerveDrive(...)</NTPath>/<NTPath>createSwerveDriveDevices(...)</NTPath> has
              telemetry configured, these same drive/azimuth PID gains (and their kS/kV/kA feedforward) become
              live-tunable over NetworkTables: edit a value from your dashboard and watch{" "}
              {real ? "the real robot" : "the sim"} respond immediately, no JSON editing required.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-sm bg-muted p-2.5 text-xs leading-relaxed">
              <code className="font-mono">
                {[
                  "// import swervelib.commands2.SwerveParser; (swervelib.commands3.SwerveParser for Commands v3)",
                  "var cfg = new SwerveDriveConfig()",
                  "    .withSubsystem(this) // .withMechanism(this) for Commands v3",
                  "    .withTranslationController(new PIDController(4, 0, 0))",
                  "    .withRotationController(new PIDController(1, 0, 0))",
                  '    .withTelemetry("swerve", new SwerveDriveTelemetryConfig(TelemetryVerbosity.HIGH));',
                  "",
                  'SwerveParser.parse(new File(Filesystem.getDeployDirectory(), "swerve/base"));',
                  "drive = SwerveParser.createSwerveDrive(cfg);",
                ].map((line, i) => (
                  <div key={i}>{line || " "}</div>
                ))}
              </code>
            </pre>
            <p className="mt-2">
              Already true if you named your drive <NTPath>"swerve"</NTPath> and used{" "}
              <NTPath>TelemetryVerbosity.HIGH</NTPath>, both shown above.
            </p>
          </>
        }
        checked={checked("setup")}
        onCheckedChange={onChange("setup")}
      >
        <LiveTelemetryCheck onFound={done("setup")} />
      </Step>
      {live.enabled ? (
        <Step
          id={stepId("tune")}
          title="Tune the azimuth and drive PID."
          detail="Start azimuth tuning, get every module tracking the angle, then switch to drive. Nothing moves until you press Start, and Stop at the bottom of the screen turns everything off."
          checked={checked("tune")}
          onCheckedChange={onChange("tune")}
        >
          <LiveTuningPanel
            real={real}
            onDone={doneTuning}
            notReadyHelp={
              real ? (
                <>
                  Enable the robot in <strong>Utility</strong> mode from the Driver Station, with no OpMode selected. A
                  teleop OpMode would drive the modules and fight the tuning.
                </>
              ) : (
                <>
                  In the sim GUI's Robot State panel, pick <strong>Utility</strong> and enable it, leaving the OpMode at
                  NONE.
                  <GuideFigure
                    src="/guide/yagsl-sim-utility-mode.png"
                    alt="The Robot State panel of the WPILib simulation GUI with Utility (1) and Enable (2) marked. The OpMode dropdown is left at NONE."
                    width={674}
                    height={372}
                    small
                  />
                </>
              )
            }
          />
        </Step>
      ) : (
        <>
          <Step
            id={stepId("enable")}
            title="Enable the tuning command."
            detail={
              <>
                <p>
                  Put the robot in <strong>Utility</strong> mode with no OpMode selected and enable it,{" "}
                  {real ? "from the Driver Station" : "in the sim GUI's Robot State panel"}. A teleop OpMode would
                  drive the modules and fight the tuning.
                </p>
                <p className="mt-2">
                  Then in AdvantageScope, turn on tuning mode (the sliders button beside the sidebar search) and
                  click <NTPath>running</NTPath> under <NTPath>Mechanisms/swerve/tuning</NTPath>. It has to be
                  running, none of the fields below do anything while it's idle.
                </p>
              </>
            }
            checked={checked("enable")}
            onCheckedChange={onChange("enable")}
          >
            {!real && (
              <GuideFigure
                src="/guide/yagsl-sim-utility-mode.png"
                alt="The Robot State panel of the WPILib simulation GUI with Utility (1) and Enable (2) marked. The OpMode dropdown is left at NONE."
                width={674}
                height={372}
                caption="In simulation: pick Utility (1), then Enable (2). Leave the OpMode at NONE."
                small
              />
            )}
            <GuideFigure
              src="/guide/yagsl-ascope-enable-tuning.png"
              alt="AdvantageScope with four numbered markers: 1 the tuning mode button beside the sidebar search, 2 the running switch under Mechanisms/swerve/tuning, 3 the angle field under Tuning/swerve/modules/azimuth, and 4 the enabled switch under the same folder."
              width={1400}
              height={900}
              caption="Turn on tuning mode (1) and click running (2). The next steps type a setpoint (3) and turn one tuning mode on (4)."
            />
          </Step>
          <Step
            id={stepId("azimuth-enable")}
            title="Switch to azimuth tuning."
            detail={
              <>
                Set <NTPath>Tuning/swerve/modules/azimuth/enabled</NTPath> to <NTPath>true</NTPath>.
              </>
            }
            checked={checked("azimuth-enable")}
            onCheckedChange={onChange("azimuth-enable")}
          >
          </Step>
          <Step
            id={stepId("azimuth-tune")}
            title="Tune the azimuth PID."
            detail="Switch the angle between 0 and 15 degrees, then edit these fields and watch every module track the target angle. Raise p until it rings, back it off, then add a little d:"
            checked={checked("azimuth-tune")}
            onCheckedChange={onChange("azimuth-tune")}
          >
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedback/p</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedback/i</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedback/d</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedforward/s</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedforward/v</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/feedforward/a</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/azimuth/angle</NTPath> (degrees, the target angle setpoint)
              </li>
            </ul>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
              <GuideFigure
                src="/guide/yagsl-tune-azimuth.gif"
                printSrc="/guide/yagsl-tune-azimuth-print.png"
                alt="An animation of every module turning from 0 to 15 degrees beside a graph of the desired and current angle: too slow with a low p, overshooting and ringing with a high p, and quick and settled with a little less p plus some d. The values are only an example."
                width={720}
                height={360}
                caption="Too slow, ringing, then quick and settled. The values are only an example."
                printCaption="The result to aim for: quick and settled, after raising p until it rings, backing it off and adding a little d. The values are only an example."
              />
              <GuideFigure
                src="/guide/yagsl-ascope-azimuth-graph.png"
                alt="An AdvantageScope line graph of Tuning/swerve/modules/azimuth/angle stepping between 0 and 15 degrees and Mechanisms/swerve/modules/frontleft/encoder following it."
                width={1100}
                height={707}
                caption="In AdvantageScope: graph Tuning/swerve/modules/azimuth/angle against a module's encoder."
              />
            </div>
          </Step>
          <Step
            id={stepId("drive-enable")}
            title="Switch to drive tuning."
            detail={
              <>
                Set <NTPath>Tuning/swerve/modules/azimuth/enabled</NTPath> back to <NTPath>false</NTPath>, then set{" "}
                <NTPath>Tuning/swerve/modules/drive/enabled</NTPath> to <NTPath>true</NTPath>.
              </>
            }
            checked={checked("drive-enable")}
            onCheckedChange={onChange("drive-enable")}
          >
          </Step>
          <Step
            id={stepId("drive-tune")}
            title="Tune the drive PID."
            detail="Set a target speed, zero the feedback, raise feedforward/v until the speed settles on the target, then add feedback/p until it gets there quickly and holds:"
            checked={checked("drive-tune")}
            onCheckedChange={onChange("drive-tune")}
          >
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedback/p</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedback/i</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedback/d</NTPath>
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedforward/s</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedforward/v</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/feedforward/a</NTPath> (optional)
              </li>
              <li>
                <NTPath>Tuning/swerve/modules/drive/velocity</NTPath> (meters per second, the target speed setpoint)
              </li>
            </ul>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
              <GuideFigure
                src="/guide/yagsl-tune-drive.gif"
                printSrc="/guide/yagsl-tune-drive-print.png"
                alt="An animation of the drive velocity against a 2 meters per second setpoint: with feedforward v too low it settles below, with v right it settles on 2 meters per second, and adding p makes it get there quickly and hold. The values are only an example."
                width={720}
                height={360}
                caption="Feedforward first, then feedback. The values are only an example."
                printCaption="The result to aim for: v set so it settles on the setpoint, then p so it gets there fast and holds. The values are only an example."
              />
              <GuideFigure
                src="/guide/yagsl-ascope-drive-graph.png"
                alt="An AdvantageScope line graph of Tuning/swerve/modules/drive/velocity stepping between 0 and 1.5 meters per second and Mechanisms/swerve/modules/frontleft/drive/measurement/velocity following it."
                width={1100}
                height={707}
                caption="In AdvantageScope: graph Tuning/swerve/modules/drive/velocity against a module's drive/measurement/velocity."
              />
            </div>
          </Step>
          <Step
            id={stepId("inplace")}
            title="Run the spin test over NetworkTables."
            detail={
              <>
                Want to run the spin test from the dashboard instead of a joystick? Flip{" "}
                <NTPath>Tuning/swerve/modules/drive/inplace</NTPath> to <NTPath>true</NTPath> while{" "}
                <NTPath>modules/drive/enabled</NTPath> is still <NTPath>true</NTPath>. Every module snaps 90&deg; off its
                radial angle (tangent to the robot center), so raising <NTPath>modules/drive/velocity</NTPath> spins the
                whole chassis in place instead of driving it straight, the same test as holding the right stick left, but
                drivable entirely over NetworkTables.
              </>
            }
            checked={checked("inplace")}
            onCheckedChange={onChange("inplace")}
          >
            <div className="mt-2 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
              <Image
                src={withBasePath("/module-drive-inplace.gif")}
                alt="Raising modules/drive/velocity with modules/drive/inplace set to true: every module points tangent to the robot center and the chassis spins in place, faster as the value increases."
                width={760}
                height={563}
                unoptimized
                loading="eager"
                className="w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10 print:hidden"
              />
              {/* A GIF prints only its first frame, before anything moves, so paper gets a frame mid-spin. */}
              <Image
                src={withBasePath("/module-drive-inplace-print.png")}
                alt="With modules/drive/inplace true and velocity raised, every module points tangent to the robot center and the chassis spins in place."
                width={760}
                height={563}
                unoptimized
                loading="eager"
                className="hidden w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10 print:block"
              />
              <Image
                src={withBasePath("/module-drive-inplace.png")}
                alt="modules/drive/enabled and modules/drive/inplace both true with velocity at -3: each module is pinwheeled 90 degrees off its radial angle and the swerve widget's rotation arrow confirms the robot is spinning cleanly about its center."
                width={1005}
                height={745}
                unoptimized
                loading="eager"
                className="w-full rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10"
              />
            </div>
          </Step>
        </>
      )}
      <Step
        id={stepId("finish")}
        title="Wrap up: disable drive tuning and copy the gains back into code."
        detail={
          <>
            <p>
              Set <NTPath>Tuning/swerve/modules/drive/enabled</NTPath> back to <NTPath>false</NTPath> when you're
              done, then copy the gains that worked into{" "}
              <NTPath>{real ? "modules/pidfproperties.json" : "modules/pidfproperties_sim.json"}</NTPath>
              {real ? ", the file the real robot reads." : ", which YAGSL reads only in simulation."} Values typed
              on the dashboard are gone the next time the robot program starts.
            </p>
            <p className="mt-2">
              <NTPath>autoalign/enabled</NTPath>, <NTPath>modules/drive/enabled</NTPath>, and{" "}
              <NTPath>modules/azimuth/enabled</NTPath> are mutually exclusive, only one can drive the modules at a
              time, so there's no need to worry about them fighting each other. See the{" "}
              <ExternalDocLink href="https://yams.yassrobotics.com/details/swerve-drive">
                YAMS swerve drive tuning guide
              </ExternalDocLink>{" "}
              for the full field list.
            </p>
          </>
        }
        checked={checked("finish")}
        onCheckedChange={onChange("finish")}
      >
        <LiveFinish real={real} onSaved={done("finish")} />
        <GuideFigure
          src="/guide/yagsl-live-tuning-save.png"
          alt="The tuning values under Tuning/swerve/modules map to the JSON: azimuth/feedback/p to angle.p, azimuth/feedback/d to angle.d, drive/feedforward/v to drive.v and drive/feedback/p to drive.p. In simulation they go into pidfproperties_sim.json, on the real robot into pidfproperties.json."
          width={720}
          height={330}
        />
      </Step>
    </>
  )
}

function NTPath({ children }: { children: string }) {
  return <code className="break-all rounded-sm bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>
}

function SwerveWidgetFields() {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5">
      <li>
        <NTPath>NT:/Mechanisms/swerve/states/current</NTPath>
      </li>
      <li>
        <NTPath>NT:/Mechanisms/swerve/states/desired</NTPath>
      </li>
      <li>
        <NTPath>NT:/Mechanisms/swerve/chassis/current</NTPath>
      </li>
      <li>
        <NTPath>NT:/Mechanisms/swerve/chassis/desired</NTPath>
      </li>
    </ul>
  )
}

const TABS = [
  "setup",
  "sim-connect",
  "sim-tune",
  "robot-connect",
  "locations",
  "align",
  "robot-tune",
  "field",
  "maintenance",
] as const

const tabSteps = (live: boolean): Record<(typeof TABS)[number], string[]> => ({
  setup: ["setup-1", "setup-2", "setup-3", "setup-4", "setup-5"],
  "sim-connect": ["sim-connect-1", "sim-connect-2", "sim-connect-3", "sim-connect-4"],
  "sim-tune": ["sim-tune-1", ...liveTuningStepIds("sim-tune-live", live), "sim-tune-3", "sim-tune-4"],
  "robot-connect": ["robot-connect-1", "robot-connect-2", "robot-connect-3", "robot-connect-4", "robot-connect-5"],
  locations: ["locations-2"],
  align: ["align-1", "align-2", "align-3"],
  "robot-tune": ["robot-tune-1", "robot-tune-2", ...liveTuningStepIds("robot-tune-live", live), "robot-tune-3", "robot-tune-4"],
  field: ["field-1", "field-2", "field-3", "field-4", "field-5"],
  maintenance: ["maintenance-1", "maintenance-2", "maintenance-3", "maintenance-4"],
})

export function TuningGuide() {
  return (
    <LiveProvider>
      <TuningGuideContent />
    </LiveProvider>
  )
}

function TuningGuideContent() {
  const live = useLive()
  const [activeTab, setActiveTab] = useState<string>(TABS[0])
  const [furthestIndex, setFurthestIndex] = useState(0)
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set())
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false)
  const [flappyOpen, setFlappyOpen] = useState(false)

  // deep-link support: jump straight to a tab from a pasted #hash (on load, or if the hash
  // changes without a full page reload), and unlock it so Back/Next work normally from there
  useEffect(() => {
    const applyHash = () => {
      const hashIndex = TABS.indexOf(window.location.hash.slice(1) as (typeof TABS)[number])
      if (hashIndex >= 0) {
        setActiveTab(TABS[hashIndex])
        setFurthestIndex((prev) => Math.max(prev, hashIndex))
      }
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  // keep the URL's #hash in sync with the active tab, so it can be copied/pasted to jump back to it --
  // the first tab is always unlocked and reachable at the bare /guide URL, so it doesn't need one
  useEffect(() => {
    const index = TABS.indexOf(activeTab as (typeof TABS)[number])
    if (index <= 0) {
      if (window.location.hash)
        window.history.replaceState(null, "", window.location.pathname + window.location.search)
      return
    }
    window.history.replaceState(null, "", `#${activeTab}`)
  }, [activeTab])

  const currentTabIndex = TABS.indexOf(activeTab as (typeof TABS)[number])
  const isFirstTab = currentTabIndex === 0
  const isLastTab = currentTabIndex === TABS.length - 1

  const steps = tabSteps(live.enabled)
  const currentStepIds = steps[activeTab as (typeof TABS)[number]]
  const remainingSteps = currentStepIds.filter((id) => !checkedSteps.has(id)).length
  const allStepsChecked = remainingSteps === 0
  const guideFinished = steps.maintenance.every((id) => checkedSteps.has(id))

  const toggleStep = (id: string, checked: boolean) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const goToTab = (index: number) => {
    if (index > furthestIndex) return
    setActiveTab(TABS[index])
  }

  const handleNext = () => {
    if (isLastTab || !allStepsChecked) return
    const nextIndex = currentTabIndex + 1
    setFurthestIndex((prev) => Math.max(prev, nextIndex))
    setActiveTab(TABS[nextIndex])
  }

  const handleBack = () => {
    if (!isFirstTab) setActiveTab(TABS[currentTabIndex - 1])
  }

  const handleSkip = () => {
    if (isLastTab) return
    const nextIndex = currentTabIndex + 1
    setFurthestIndex((prev) => Math.max(prev, nextIndex))
    setActiveTab(TABS[nextIndex])
    setSkipConfirmOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:flex-row print:items-center print:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={withBasePath("/yagsl-logo.png")}
                alt="YAGSL logo"
                width={48}
                height={48}
                className="h-10 w-10 md:h-12 md:w-12"
                style={{ imageRendering: "pixelated" }}
              />
              <div>
                <h1 className="font-pixel text-[11px] leading-relaxed text-primary md:text-sm">Quick Start Guide</h1>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                  Your configuration has been downloaded. Check off each step as you complete it,
                  so nothing important gets missed.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 no-print">
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <Link href="/">
                  <Settings className="h-4 w-4" />
                  Back to Config
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <a href="https://discord.gg/yass" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Need Help?
                </a>
              </Button>
              <LiveModeToggle />
              <PrintButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <div className="yass-stripe no-print" aria-hidden />

      <main className="container mx-auto px-4 py-4 md:py-8 print:max-w-none print:p-0">
        <Card className="p-4 md:p-6 print:border-none print:p-0 print:shadow-none">
          <Tabs
            value={activeTab}
            onValueChange={(value) => goToTab(TABS.indexOf(value as (typeof TABS)[number]))}
            className="w-full print-all-tabs"
          >
            <div className="mb-2 -mx-4 px-4 overflow-x-auto no-print">
              <TabsList className="inline-flex w-auto min-w-full">
                {[
                  { value: "setup", label: "1. Set Up Project" },
                  { value: "sim-connect", label: "2. Connect (Sim)" },
                  { value: "sim-tune", label: "3. Tune Sim" },
                  { value: "robot-connect", label: "4. Connect (Robot)" },
                  { value: "locations", label: "5. Locations" },
                  { value: "align", label: "6. Align Modules" },
                  { value: "robot-tune", label: "7. Tune Real Robot" },
                  { value: "field", label: "8. Verify Field" },
                  { value: "maintenance", label: "9. Maintenance" },
                ].map((tab, index) => {
                  const locked = index > furthestIndex
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      aria-disabled={locked}
                      title={locked ? "Double click to preview" : undefined}
                      aria-label={locked ? `${tab.label}: double click to preview` : undefined}
                      onDoubleClick={() => setActiveTab(tab.value)}
                      className={cn("whitespace-nowrap gap-1.5", locked && "cursor-not-allowed opacity-60")}
                    >
                      {locked && <Lock className="h-3 w-3" />}
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* 1. Set up the robot project */}
            <TabsContent value="setup" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Set Up Your Robot Project</h3>

              <Step
                id="setup-1"
                title="Clone the YAGSL repository."
                detail={
                  <>
                    Clone{" "}
                    <ExternalDocLink href="https://github.com/Yet-Another-Software-Suite/YAGSL">
                      Yet-Another-Software-Suite/YAGSL
                    </ExternalDocLink>{" "}
                    to your computer.
                  </>
                }
                checked={checkedSteps.has("setup-1")}
                onCheckedChange={(c) => toggleStep("setup-1", c)}
              />
              <Step
                id="setup-2"
                title="Copy an example project out."
                detail={
                  <>
                    The repository's <ExternalDocLink href={EXAMPLE_PROJECT_URL}>examples</ExternalDocLink> folder
                    has two: <NTPath>commands2</NTPath> for WPILib Commands v2, and <NTPath>commands3</NTPath> for
                    Commands v3. Copy the contents of the one your team uses out of the cloned repository and into
                    your own robot project directory. That's what you'll actually build and deploy.
                  </>
                }
                checked={checkedSteps.has("setup-2")}
                onCheckedChange={(c) => toggleStep("setup-2", c)}
              />
              <Step
                id="setup-3"
                title="Change the team number."
                detail="In your new project, set it to your own team number. With the WPILib VS Code extension, that's Ctrl+Shift+P → WPILib: Set Team Number (or edit it directly in .wpilib/wpilib_preferences.json)."
                checked={checkedSteps.has("setup-3")}
                onCheckedChange={(c) => toggleStep("setup-3", c)}
              />
              <Step
                id="setup-4"
                title="Delete src/main/deploy/swerve."
                detail={
                  <>
                    Delete the example project's default <NTPath>src/main/deploy/swerve</NTPath> folder. You'll
                    replace it with your own generated configuration next.
                  </>
                }
                checked={checkedSteps.has("setup-4")}
                onCheckedChange={(c) => toggleStep("setup-4", c)}
              />
              <Step
                id="setup-5"
                title="Unzip your downloaded config into src/main/deploy/swerve."
                detail={
                  <>
                    Extract the zip you downloaded from this site and place its contents directly into{" "}
                    <NTPath>src/main/deploy/swerve</NTPath>, so you end up with{" "}
                    <NTPath>src/main/deploy/swerve/swervedrive.json</NTPath> and a{" "}
                    <NTPath>src/main/deploy/swerve/modules/</NTPath> folder alongside it.
                  </>
                }
                checked={checkedSteps.has("setup-5")}
                onCheckedChange={(c) => toggleStep("setup-5", c)}
              />
            </TabsContent>

            {/* 2. Connect AdvantageScope to the simulator */}
            <TabsContent value="sim-connect" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Connect AdvantageScope to the Simulator</h3>

              <Step
                id="sim-connect-1"
                title="Build and start the robot simulator."
                detail={
                  <>
                    New to the simulator?{" "}
                    <Link
                      href="https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robot-simulation/introduction.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                    >
                      WPILib's guide to robot simulation
                      <ExternalLink className="h-3 w-3" />
                    </Link>{" "}
                    walks through starting it.
                  </>
                }
                checked={checkedSteps.has("sim-connect-1")}
                onCheckedChange={(c) => toggleStep("sim-connect-1", c)}
              />
              <Step
                id="sim-connect-2"
                title="Open AdvantageScope."
                checked={checkedSteps.has("sim-connect-2")}
                onCheckedChange={(c) => toggleStep("sim-connect-2", c)}
              />
              <Step
                id="sim-connect-3"
                title="Connect to the simulator."
                detail={
                  <>
                    <strong>File → Connect to Simulator</strong> (Ctrl+Shift+K).
                  </>
                }
                checked={checkedSteps.has("sim-connect-3")}
                onCheckedChange={(c) => toggleStep("sim-connect-3", c)}
              />
              <Step
                id="sim-connect-4"
                title="Add the swerve fields to the Swerve widget."
                detail="Drag in each of these NetworkTables fields:"
                checked={checkedSteps.has("sim-connect-4")}
                onCheckedChange={(c) => toggleStep("sim-connect-4", c)}
              >
                <SwerveWidgetFields />
              </Step>

              <ExampleProjectNote />
            </TabsContent>

            {/* 3. Tune in simulation */}
            <TabsContent value="sim-tune" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Tune the Swerve Drive PID in Simulation</h3>

              <Step
                id="sim-tune-1"
                title="Edit the sim PID gains."
                detail={
                  <>
                    <p>
                      Open <NTPath>modules/pidfproperties_sim.json</NTPath> from your downloaded configuration and
                      edit the drive and angle PID gains. <PidTuningLinks />
                    </p>
                    <ModuleMotorAnimation />
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Feedforward is optional.</strong> <NTPath>s</NTPath>, <NTPath>v</NTPath>, and{" "}
                        <NTPath>a</NTPath> (kS, kV, kA) can be tuned too, for an even better fit.
                      </li>
                      <li>
                        <strong>The drive motor already has a default v.</strong> It's computed from the free speed
                        RPM of the motor you selected for that module, but only applies when you haven't set your
                        own <NTPath>v</NTPath>.
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("sim-tune-1")}
                onCheckedChange={(c) => toggleStep("sim-tune-1", c)}
              >
                <JsonDiff
                  filename="modules/pidfproperties_sim.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/pidfproperties.json",' },
                    { text: '  "drive": {' },
                    { text: '    "p": 0.1,' },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0.7,' },
                    { text: '    "a": 0.1' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "p": 0.01,' },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0,' },
                    { text: '    "a": 0' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/pidfproperties.json",' },
                    { text: '  "drive": {' },
                    { text: '    "p": 0.35,', changed: true },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0.7,' },
                    { text: '    "a": 0.1' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "p": 0.06,', changed: true },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0.0015,', changed: true },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0,' },
                    { text: '    "a": 0' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <h4 className="pt-2 text-base font-semibold">Live-tune the PID gains over NetworkTables</h4>
              <LiveTuningSteps
                real={false}
                idPrefix="sim-tune-live"
                checkedSteps={checkedSteps}
                toggleStep={toggleStep}
              />
              <Step
                id="sim-tune-3"
                title="Drive the simulated robot around."
                checked={checkedSteps.has("sim-tune-3")}
                onCheckedChange={(c) => toggleStep("sim-tune-3", c)}
              />
              <Step
                id="sim-tune-4"
                title="Compare current vs. desired, and keep tuning."
                detail={
                  <>
                    Compare the "current" and "desired" traces in the Swerve widget, and keep adjusting the gains in{" "}
                    <NTPath>pidfproperties_sim.json</NTPath> until the current state closely tracks the desired
                    state.
                  </>
                }
                checked={checkedSteps.has("sim-tune-4")}
                onCheckedChange={(c) => toggleStep("sim-tune-4", c)}
              />

              <ExampleProjectNote />
            </TabsContent>

            {/* 4. Connect AdvantageScope to the real robot */}
            <TabsContent value="robot-connect" forceMount className="space-y-3">
              <div className="flex items-start gap-2 mb-1">
                <PartyPopper className="mt-0.5 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Nice work tuning the simulator! Now let's move to the real robot.</h3>
              </div>

              <Step
                id="robot-connect-1"
                title="Run the program on the real robot."
                checked={checkedSteps.has("robot-connect-1")}
                onCheckedChange={(c) => toggleStep("robot-connect-1", c)}
              />
              <Step
                id="robot-connect-2"
                title="Open AdvantageScope (if it isn't already open)."
                checked={checkedSteps.has("robot-connect-2")}
                onCheckedChange={(c) => toggleStep("robot-connect-2", c)}
              />
              <Step
                id="robot-connect-3"
                title="Point AdvantageScope at the robot's address."
                detail={
                  <>
                    <strong>App → Show Preferences</strong> (Ctrl+,), and set the robot address to the IP address of
                    the system core.
                  </>
                }
                checked={checkedSteps.has("robot-connect-3")}
                onCheckedChange={(c) => toggleStep("robot-connect-3", c)}
              />
              <Step
                id="robot-connect-4"
                title="Connect to the robot."
                detail={
                  <>
                    <strong>File → Connect to Robot</strong> (Ctrl+K).
                  </>
                }
                checked={checkedSteps.has("robot-connect-4")}
                onCheckedChange={(c) => toggleStep("robot-connect-4", c)}
              />
              <Step
                id="robot-connect-5"
                title="Add the swerve fields to the Swerve widget."
                detail="Drag in each of these NetworkTables fields:"
                checked={checkedSteps.has("robot-connect-5")}
                onCheckedChange={(c) => toggleStep("robot-connect-5", c)}
              >
                <SwerveWidgetFields />
              </Step>

              <ExampleProjectNote />
            </TabsContent>

            {/* 5. Module locations */}
            <TabsContent value="locations" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Module Locations</h3>

              <Alert>
                <AlertTitle>Know how module location is measured</AlertTitle>
                <AlertDescription>
                  This is very important: module locations are measured from the center of the robot to the center
                  of each module (wheel), in inches. Keep this in mind as you go through the next step.
                </AlertDescription>
              </Alert>
              <ModuleLocationDiagram />
              <Alert>
                <AlertDescription>
                  The "center of robot" in the diagram above is actually the center of rotation, and ideally, that
                  should also be your robot's center of mass. If the center of rotation isn't the center of mass,
                  the robot will drift while rotating instead of spinning cleanly in place.
                </AlertDescription>
              </Alert>

              <Step
                id="locations-2"
                title="Enter each module's location in its json file."
                detail={
                  <>
                    Goes in that module's own json file (<NTPath>modules/frontleft.json</NTPath>,{" "}
                    <NTPath>frontright.json</NTPath>, <NTPath>backleft.json</NTPath>,{" "}
                    <NTPath>backright.json</NTPath>), under <NTPath>location.front</NTPath> and{" "}
                    <NTPath>location.left</NTPath>.
                  </>
                }
                checked={checkedSteps.has("locations-2")}
                onCheckedChange={(c) => toggleStep("locations-2", c)}
              >
                <JsonDiff
                  filename="modules/frontleft.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 0,' },
                    { text: '  "absoluteEncoderInverted": false,' },
                    { text: '  "location": {' },
                    { text: '    "front": 0,', changed: true },
                    { text: '    "left": 0', changed: true },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 0,' },
                    { text: '  "absoluteEncoderInverted": false,' },
                    { text: '  "location": {' },
                    { text: '    "front": 12.5,', changed: true },
                    { text: '    "left": 10.5', changed: true },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
            </TabsContent>

            {/* 6. Align modules */}
            <TabsContent value="align" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Align the Swerve Modules</h3>

              <Step
                id="align-1"
                title="Rotate every wheel forward, bevel gear left."
                detail="Viewed from directly above, with the robot's front pointing away from you."
                checked={checkedSteps.has("align-1")}
                onCheckedChange={(c) => toggleStep("align-1", c)}
              >
                <SwerveAlignAnimation />
              </Step>
              <Step
                id="align-2"
                title="Record each module's absolute encoder offset."
                detail={
                  <>
                    With AdvantageScope connected to the robot, for each module read the value at{" "}
                    <NTPath>NT:/Mechanisms/swerve/modules/[module_name]/encoder</NTPath> while it's held in this
                    aligned position, and copy that value into that module's <NTPath>absoluteEncoderOffset</NTPath>.
                  </>
                }
                checked={checkedSteps.has("align-2")}
                onCheckedChange={(c) => toggleStep("align-2", c)}
              >
                <GuideFigure
                  src="/guide/yagsl-record-offsets.gif"
                  printSrc="/guide/yagsl-record-offsets-print.png"
                  alt="An animation of each module's encoder reading in AdvantageScope being copied into its JSON, one module at a time: frontleft 132.363 degrees, frontright minus 50.977, backleft 271.143 and backright 12.656, each into that module's absoluteEncoderOffset."
                  width={720}
                  height={360}
                />
                <JsonDiff
                  filename="modules/frontleft.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 0,', changed: true },
                    { text: '  "absoluteEncoderInverted": false,' },
                    { text: '  "location": {' },
                    { text: '    "front": 12.5,' },
                    { text: '    "left": 10.5' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 173.4,', changed: true },
                    { text: '  "absoluteEncoderInverted": false,' },
                    { text: '  "location": {' },
                    { text: '    "front": 12.5,' },
                    { text: '    "left": 10.5' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="align-3"
                title="Confirm the reading is counterclockwise positive (CCW+)."
                checked={checkedSteps.has("align-3")}
                onCheckedChange={(c) => toggleStep("align-3", c)}
                detail={
                  <>
                  The absolute encoder reading should be counterclockwise positive (CCW+) (increasing as the module rotates counterclockwise
                    from a top-down view). If it isn't, you need to set that module's{" "}
                    <NTPath>absoluteEncoderInverted</NTPath> to <NTPath>true</NTPath>. This is rare: most absolute
                    encoders already read counterclockwise positive (CCW+) by default, so only change this if you've confirmed the reading is
                    backwards.
                    </>
                }
              >
                <JsonDiff
                  filename="modules/frontleft.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 173.4,' },
                    { text: '  "absoluteEncoderInverted": false,', changed: true },
                    { text: '  "location": {' },
                    { text: '    "front": 12.5,' },
                    { text: '    "left": 10.5' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/module.json",' },
                    { text: '  "drive": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "type": "sparkmax_neo",' },
                    { text: '    "id": 2,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "inverted": {' },
                    { text: '    "drive": false,' },
                    { text: '    "angle": false' },
                    { text: "  }," },
                    { text: '  "absoluteEncoder": {' },
                    { text: '    "type": "cancoder_can",' },
                    { text: '    "id": 3,' },
                    { text: '    "channel": 0,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "absoluteEncoderOffset": 173.4,' },
                    { text: '  "absoluteEncoderInverted": true,', changed: true },
                    { text: '  "location": {' },
                    { text: '    "front": 12.5,' },
                    { text: '    "left": 10.5' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>

              <ExampleProjectNote />
            </TabsContent>

            {/* 7. Tune real robot */}
            <TabsContent value="robot-tune" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Tune the Real Robot</h3>

              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Lift the robot off the ground first</AlertTitle>
                <AlertDescription>
                  It is very important to initially tune the real robot with the modules elevated off the ground, so
                  they can rotate freely without hitting anything.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  If something is only happening to one module, there's likely something physically wrong with that
                  module. When in doubt, check wiring first, then gears, and if all else fails, rebuild the module,
                  paying special attention to the instructions.
                </AlertDescription>
              </Alert>

              <Step
                id="robot-tune-1"
                title="Rotate the robot counterclockwise (CCW) and check the gyro."
                detail="With the robot off the ground, rotate it counterclockwise (CCW) (from a top-down view) and confirm the gyro reads counterclockwise positive (CCW+)."
                checked={checkedSteps.has("robot-tune-1")}
                onCheckedChange={(c) => toggleStep("robot-tune-1", c)}
              >
                <GyroCheckAnimation />
                <p className="text-sm text-muted-foreground">
                  Only change <NTPath>gyroInvert</NTPath> if the CCW test above failed (the gyro decreased instead
                  of increased). If it read correctly, leave it alone, there's nothing to change here.
                </p>
                <JsonDiff
                  filename="swervedrive.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/swervedrive.json",' },
                    { text: '  "gyro": {' },
                    { text: '    "type": "pigeon2_can",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "gyroAxis": "yaw",' },
                    { text: '  "gyroInvert": false,', changed: true },
                    { text: '  "modules": [' },
                    { text: '    "frontleft.json",' },
                    { text: '    "frontright.json",' },
                    { text: '    "backleft.json",' },
                    { text: '    "backright.json"' },
                    { text: "  ]" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/swervedrive.json",' },
                    { text: '  "gyro": {' },
                    { text: '    "type": "pigeon2_can",' },
                    { text: '    "id": 1,' },
                    { text: '    "canbus": ""' },
                    { text: "  }," },
                    { text: '  "gyroAxis": "yaw",' },
                    { text: '  "gyroInvert": true,', changed: true },
                    { text: '  "modules": [' },
                    { text: '    "frontleft.json",' },
                    { text: '    "frontright.json",' },
                    { text: '    "backleft.json",' },
                    { text: '    "backright.json"' },
                    { text: "  ]" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="robot-tune-2"
                title="Tune the real robot's PID gains."
                detail={
                  <>
                    <p>
                      Just like in simulation, edit <NTPath>modules/pidfproperties.json</NTPath> to tune the drive
                      and angle PID gains, this time for the real robot. <PidTuningLinks />
                    </p>
                    {/* Printed once already, in the simulator's tuning step, so the repeat is left off paper. */}
                    <ModuleMotorAnimation className="print:hidden" />
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Feedforward is optional.</strong> <NTPath>s</NTPath>, <NTPath>v</NTPath>, and{" "}
                        <NTPath>a</NTPath> (kS, kV, kA) can be tuned too, for an even better fit.
                      </li>
                      <li>
                        <strong>The drive motor already has a default v.</strong> It's computed from the free speed
                        RPM of the motor you selected for that module, but only applies when you haven't set your
                        own <NTPath>v</NTPath>.
                      </li>
                      <li>
                        <strong>You must redeploy to test.</strong> Editing the json file alone doesn't change
                        anything on the robot, redeploy the code every time you want to test a change.
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("robot-tune-2")}
                onCheckedChange={(c) => toggleStep("robot-tune-2", c)}
              >
                <JsonDiff
                  filename="modules/pidfproperties.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/pidfproperties.json",' },
                    { text: '  "drive": {' },
                    { text: '    "p": 0.1,' },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0.7,' },
                    { text: '    "a": 0.1' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "p": 0.01,' },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0,' },
                    { text: '    "a": 0' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/pidfproperties.json",' },
                    { text: '  "drive": {' },
                    { text: '    "p": 0.28,', changed: true },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0,' },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0.7,' },
                    { text: '    "a": 0.1' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "p": 0.05,', changed: true },
                    { text: '    "i": 0,' },
                    { text: '    "d": 0.001,', changed: true },
                    { text: '    "s": 0,' },
                    { text: '    "v": 0,' },
                    { text: '    "a": 0' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
                <Alert>
                  <AlertDescription>
                    <p>
                      Mistakes happen when building modules, and motors can and do die. If a module won't tune
                      correctly, work through this before assuming the motor is bad:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Check it spins freely by hand.</strong> With the robot off the ground and powered
                        off, both the drive wheel and the azimuth of the module should spin with no friction. If
                        either doesn't, rebuild that module, paying special attention to the assembly instructions.
                      </li>
                      <li>
                        <strong>Check that motor's stator (output) current.</strong> A stalling motor draws
                        exceedingly high stator current and heats up quickly, that usually means a dead or dying
                        motor.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </Step>
              <h4 className="pt-2 text-base font-semibold">Live-tune the PID gains over NetworkTables</h4>
              <LiveTuningSteps
                real
                idPrefix="robot-tune-live"
                checkedSteps={checkedSteps}
                toggleStep={toggleStep}
              />
              <Step
                id="robot-tune-3"
                title="Spin each module 5 full turns and check it lands back where it started."
                detail={
                  <>
                    With the <strong>robot disabled</strong> (motors not fighting you, but telemetry still live) and
                    off the ground,
                    by hand rotate one module's azimuth exactly 5 full turns (360° × 5), then check that module's
                    current state in AdvantageScope, it should read the relatively close same angle it started at. If it
                    doesn't, that module's gear ratio is wrong:
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Wrong gear installed:</strong> azimuth and drive gears often look very similar and
                        are easy to mix up during assembly. Check the vendor's website for the expected gear ratio,
                        and reassemble the module to check it was built correctly.
                      </li>
                      <li>
                        <strong>Wrong value entered:</strong> double check the gear ratio in{" "}
                        <NTPath>physicalproperties.json</NTPath> (or that module's gearing override) against the
                        vendor's spec.
                      </li>
                    </ul>
                    <p className="mt-2">
                      You can run the same 5-turn test on each drive motor too: rotate the wheel by hand exactly 5
                      full turns and confirm the reported distance traveled matches what you'd expect. This only
                      matters on the real robot, simulation doesn't model gearing mistakes.
                    </p>
                  </>
                }
                checked={checkedSteps.has("robot-tune-3")}
                onCheckedChange={(c) => toggleStep("robot-tune-3", c)}
              >
                <JsonDiff
                  filename="modules/physicalproperties.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/physicalproperties.json",' },
                    { text: '  "gearing": {' },
                    { text: '    "drive": {' },
                    { text: '      "gearRatio": 6.75,' },
                    { text: '      "diameter": 4' },
                    { text: "    }," },
                    { text: '    "angle": {' },
                    { text: '      "gearRatio": 12.8', changed: true },
                    { text: "    }," },
                    { text: '    "statorCurrentLimit": {' },
                    { text: '      "drive": 40,' },
                    { text: '      "angle": 40' },
                    { text: "    }" },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/physicalproperties.json",' },
                    { text: '  "gearing": {' },
                    { text: '    "drive": {' },
                    { text: '      "gearRatio": 6.75,' },
                    { text: '      "diameter": 4' },
                    { text: "    }," },
                    { text: '    "angle": {' },
                    { text: '      "gearRatio": 21.43', changed: true },
                    { text: "    }," },
                    { text: '    "statorCurrentLimit": {' },
                    { text: '      "drive": 40,' },
                    { text: '      "angle": 40' },
                    { text: "    }" },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="robot-tune-4"
                title="Hold the right stick left and check the spin direction."
                detail={
                  <>
                    <p>
                      Still with the robot off the ground, hold the right stick to the left. The right stick's
                      left/right axis controls angular velocity: left commands the robot to rotate left (CCW),
                      right commands it to rotate right (CW). Verify the robot matches the AdvantageScope swerve
                      widget below (top-down view). Common problems:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Drifts or translates instead of spinning in place:</strong> the wrong CAN IDs for a
                        module, or the wrong absolute encoder offset.
                      </li>
                      <li>
                        <strong>Spins cleanly but the wrong way (clockwise (CW) instead of CCW):</strong>
                        <ul className="mt-1 list-[circle] space-y-1 pl-5">
                          <li>Inverted drive motors.</li>
                          <li>A diagonal module swap: front-left ↔ back-right, front-right ↔ back-left.</li>
                          <li>Absolute encoder offsets that were captured with the bevel gear facing right instead of left.</li>
                        </ul>
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("robot-tune-4")}
                onCheckedChange={(c) => toggleStep("robot-tune-4", c)}
              >
                <ControllerAnimation
                  stick="right"
                  motion="hold"
                  direction="left"
                  label="Hold the right stick left to rotate left (CCW)"
                />
                <SpinTestAnimation />
              </Step>

              <ExampleProjectNote />
            </TabsContent>

            {/* 8. Verify field orientation */}
            <TabsContent value="field" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Verify Field Orientation</h3>

              <Step
                id="field-1"
                title="Add the field widget."
                detail={
                  <>
                    In AdvantageScope, open the 2D Field feature and drag in{" "}
                    <NTPath>NT:/Mechanisms/swerve/pose</NTPath>.
                  </>
                }
                checked={checkedSteps.has("field-1")}
                onCheckedChange={(c) => toggleStep("field-1", c)}
              />
              <Step
                id="field-2"
                title="Test forward/back/left/right at the starting heading."
                detail={
                  <>
                    <p>
                      Drive it forward, back, left, and right, and verify the robot moves in the matching direction
                      on the field relative to the driver station's position. Common problems:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Wrong at every heading, including this one:</strong> check{" "}
                        <NTPath>gyroInvert</NTPath> in <NTPath>swervedrive.json</NTPath>.
                      </li>
                      <li>
                        <strong>Only wrong once you rotate to 45°/125° later on:</strong> it doesn't show up until
                        the robot isn't sitting at its starting heading, which points away from the gyro and toward
                        one of these instead:
                        <ul className="mt-1 list-[circle] space-y-1 pl-5">
                          <li>An absolute encoder offset that's off.</li>
                          <li>A drive motor inversion mistake.</li>
                          <li>A wrong module location (front/left).</li>
                          <li>Wiring: an absolute encoder wired to the wrong motor controller.</li>
                          <li>A wrong CAN ID: a module assigned an incorrect ID.</li>
                        </ul>
                        <p className="mt-1">
                          Verify the wiring and CAN IDs are correct first, they're the quickest to rule out. If the
                          problem persists, redo the guide's tuning steps starting from Align Modules to recapture
                          everything.
                        </p>
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("field-2")}
                onCheckedChange={(c) => toggleStep("field-2", c)}
              >
                <ControllerAnimation
                  stick="left"
                  motion="cross"
                  label="Use the left stick to drive forward/back/left/right"
                />
                <FieldOrientationAnimation />
              </Step>
              <Step
                id="field-3"
                title="Spin in place and watch the field widget."
                detail={
                  <>
                    <p>
                      Spin the robot in place again (right stick held left, CCW), but this time watch the field
                      widget's heading instead of the swerve module states widget. Common problems:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Drifts or translates instead of spinning in place:</strong> the wrong CAN IDs for a
                        module, or the wrong absolute encoder offset.
                      </li>
                      <li>
                        <strong>Spins cleanly but the wrong way (clockwise (CW) instead of CCW):</strong>
                        <ul className="mt-1 list-[circle] space-y-1 pl-5">
                          <li>Inverted drive motors.</li>
                          <li>A diagonal module swap: front-left ↔ back-right, front-right ↔ back-left.</li>
                          <li>Absolute encoder offsets that were captured with the bevel gear facing right instead of left.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Looked correct on the previous tab, but wrong here:</strong> an inverted gyro can
                        flip the field widget's spin direction even when the swerve module states widget looked
                        right.
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("field-3")}
                onCheckedChange={(c) => toggleStep("field-3", c)}
              >
                <ControllerAnimation
                  stick="right"
                  motion="hold"
                  direction="left"
                  label="Hold the right stick left to rotate left (CCW)"
                />
                <SpinTestAnimation />
              </Step>
              <Step
                id="field-4"
                title="Retest cardinal directions at a 45° heading."
                detail="Rotate the robot so its heading reads about 45°, then test all four cardinal directions again. The robot should still move the same way relative to the driver station, no matter which way its chassis is pointing."
                checked={checkedSteps.has("field-4")}
                onCheckedChange={(c) => toggleStep("field-4", c)}
              >
                <FieldOrientationAnimation heading={45} />
              </Step>
              <Step
                id="field-5"
                title="Repeat once more at a 125° heading."
                checked={checkedSteps.has("field-5")}
                onCheckedChange={(c) => toggleStep("field-5", c)}
              >
                <FieldOrientationAnimation heading={125} />
              </Step>

              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Watch for absolute encoder drift</AlertTitle>
                <AlertDescription>
                  Your absolute encoder offsets should not change over time. If they do, it's likely because there's
                  no loctite/glue on the magnet (if you're using magnetic encoders) on that module. Check that
                  module's build instructions for how to properly loctite/glue the magnet in place, and reapply it.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* 9. Swerve maintenance */}
            <TabsContent value="maintenance" forceMount className="space-y-3">
              <h3 className="text-lg font-semibold">Swerve Maintenance</h3>
              <p className="text-sm text-muted-foreground">
                Your swerve drive doesn't stop needing attention once it's tuned. Keep these in mind for the rest of
                the season.
              </p>

              <Step
                id="maintenance-1"
                title="Grease the swerve modules regularly."
                detail="Regular greasing keeps modules performing optimally. Grease them at the beginning of tuning, and again in between events. Don't overgrease them, though: excess grease attracts debris and adds resistance instead of reducing it."
                checked={checkedSteps.has("maintenance-1")}
                onCheckedChange={(c) => toggleStep("maintenance-1", c)}
              />
              <Step
                id="maintenance-2"
                title="Re-measure your wheels if autonomous starts over/undershooting."
                detail={
                  <>
                    Swerve wheels wear down and degrade over time, so the diameter you configured may no longer
                    match the wheel's actual size. If you notice consistent over- or under-shooting in autonomous,
                    re-measure the wheel and double check the drive gear ratio and diameter in{" "}
                    <NTPath>physicalproperties.json</NTPath> (or that module's gearing override).
                  </>
                }
                checked={checkedSteps.has("maintenance-2")}
                onCheckedChange={(c) => toggleStep("maintenance-2", c)}
              >
                <JsonDiff
                  filename="modules/physicalproperties.json"
                  before={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/physicalproperties.json",' },
                    { text: '  "gearing": {' },
                    { text: '    "drive": {' },
                    { text: '      "gearRatio": 6.75,' },
                    { text: '      "diameter": 4', changed: true },
                    { text: "    }," },
                    { text: '    "angle": {' },
                    { text: '      "gearRatio": 21.43' },
                    { text: "    }," },
                    { text: '    "statorCurrentLimit": {' },
                    { text: '      "drive": 40,' },
                    { text: '      "angle": 40' },
                    { text: "    }" },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: "{" },
                    { text: '  "$schema": "https://config.yagsl.com/schemas/physicalproperties.json",' },
                    { text: '  "gearing": {' },
                    { text: '    "drive": {' },
                    { text: '      "gearRatio": 6.75,' },
                    { text: '      "diameter": 3.87', changed: true },
                    { text: "    }," },
                    { text: '    "angle": {' },
                    { text: '      "gearRatio": 21.43' },
                    { text: "    }," },
                    { text: '    "statorCurrentLimit": {' },
                    { text: '      "drive": 40,' },
                    { text: '      "angle": 40' },
                    { text: "    }" },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="maintenance-3"
                title="Watch for consistent azimuth angle drift."
                detail="If a module's azimuth angle is consistently off in real life (not just a one-time calibration slip), the gear may be skipping under load, or it may have been replaced with the wrong gear at some point. Recheck that module's gear against the vendor's spec, and rebuild the module if needed."
                checked={checkedSteps.has("maintenance-3")}
                onCheckedChange={(c) => toggleStep("maintenance-3", c)}
              />
              <Step
                id="maintenance-4"
                title="If it's only happening to one module, suspect that module."
                detail="When an issue is isolated to a single module instead of the whole drivetrain, there's likely something physically wrong with that module specifically. When in doubt, check wiring first, then gears, and if all else fails, rebuild the module, paying special attention to the instructions."
                checked={checkedSteps.has("maintenance-4")}
                onCheckedChange={(c) => toggleStep("maintenance-4", c)}
              />

              {guideFinished && (
                <div className="flex justify-end pt-2 no-print animate-in fade-in duration-700">
                  <button
                    type="button"
                    onClick={() => setFlappyOpen(true)}
                    className="group rounded-full p-1 transition-transform motion-safe:hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Image
                      src={withBasePath("/rivet.png")}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 opacity-70 transition-opacity group-hover:opacity-100"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="sr-only">You found Rivet, play a hidden game</span>
                  </button>
                </div>
              )}
            </TabsContent>

            <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border no-print">
              {!allStepsChecked && !isLastTab && (
                <p className="text-center text-xs text-muted-foreground">
                  Check off {remainingSteps === 1 ? "the last step" : `all ${remainingSteps} remaining steps`} above
                  to continue.
                </p>
              )}
              <div className="flex justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isFirstTab}
                  className="flex-1 md:flex-none bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex flex-1 gap-2 md:flex-none">
                  {!isLastTab && (
                    <Button
                      variant="outline"
                      onClick={() => setSkipConfirmOpen(true)}
                      className="flex-1 md:flex-none bg-transparent"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                  )}

                  {isLastTab ? (
                    <Button asChild className="flex-1 md:flex-none">
                      <Link href="/">Back to Configuration</Link>
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={!allStepsChecked} className="flex-1 md:flex-none">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        </Card>
      </main>
      {/* With Live mode on, room for the stop bar along the bottom */}
      <SiteFooter className={cn(live.enabled && "pb-16")} />
      <LiveStopBar />

      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent className="no-print">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't checked off all the steps on this tab. Skipping means you might miss something important.
              You can always come back to it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip}>Skip anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={flappyOpen} onOpenChange={setFlappyOpen}>
        <DialogContent className="w-auto max-h-[90vh] overflow-y-auto overscroll-contain no-print">
          <DialogTitle className="sr-only">Flappy Rivet</DialogTitle>
          <FlappyRivetGame />
        </DialogContent>
      </Dialog>
    </div>
  )
}
