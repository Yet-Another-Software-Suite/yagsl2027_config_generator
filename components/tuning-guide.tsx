"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, ExternalLink, TriangleAlert, PartyPopper, Lock } from "lucide-react"
import { SwerveAlignAnimation } from "@/components/swerve-align-animation"
import { ModuleLocationDiagram } from "@/components/module-location-diagram"
import { ControllerAnimation } from "@/components/controller-animation"
import { GyroCheckAnimation } from "@/components/gyro-check-animation"
import { SpinTestAnimation } from "@/components/spin-test-animation"
import { FieldOrientationAnimation } from "@/components/field-orientation-animation"
import { JsonDiff } from "@/components/json-diff"
import { Step } from "@/components/tuning-step"
import { cn } from "@/lib/utils"

const EXAMPLE_PROJECT_URL = "https://github.com/Yet-Another-Software-Suite/YAGSL/tree/main/example"

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
        . (Note: this link isn't live yet, but will be by the time you're using this site.)
      </AlertDescription>
    </Alert>
  )
}

function NTPath({ children }: { children: string }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>
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
  "sim-connect",
  "sim-tune",
  "robot-connect",
  "locations",
  "align",
  "robot-tune",
  "field",
  "maintenance",
] as const

const TAB_STEPS: Record<(typeof TABS)[number], string[]> = {
  "sim-connect": ["sim-connect-1", "sim-connect-2", "sim-connect-3", "sim-connect-4"],
  "sim-tune": ["sim-tune-1", "sim-tune-2", "sim-tune-3", "sim-tune-4"],
  "robot-connect": ["robot-connect-1", "robot-connect-2", "robot-connect-3", "robot-connect-4", "robot-connect-5"],
  locations: ["locations-1", "locations-2"],
  align: ["align-1", "align-2", "align-3"],
  "robot-tune": ["robot-tune-1", "robot-tune-2", "robot-tune-3", "robot-tune-4"],
  field: ["field-1", "field-2", "field-3", "field-4", "field-5"],
  maintenance: ["maintenance-1", "maintenance-2", "maintenance-3"],
}

export function TuningGuide() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0])
  const [furthestIndex, setFurthestIndex] = useState(0)
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set())

  const currentTabIndex = TABS.indexOf(activeTab as (typeof TABS)[number])
  const isFirstTab = currentTabIndex === 0
  const isLastTab = currentTabIndex === TABS.length - 1

  const currentStepIds = TAB_STEPS[activeTab as (typeof TABS)[number]]
  const remainingSteps = currentStepIds.filter((id) => !checkedSteps.has(id)).length
  const allStepsChecked = remainingSteps === 0

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Tuning Guide</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Your configuration has been downloaded. Check off each step as you complete it — you can't skip ahead,
            so nothing important gets missed.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Card className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(value) => goToTab(TABS.indexOf(value as (typeof TABS)[number]))} className="w-full">
            <div className="mb-2 -mx-4 px-4 overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-8">
                {[
                  { value: "sim-connect", label: "1. Connect (Sim)" },
                  { value: "sim-tune", label: "2. Tune in Sim" },
                  { value: "robot-connect", label: "3. Connect (Robot)" },
                  { value: "locations", label: "4. Locations" },
                  { value: "align", label: "5. Align Modules" },
                  { value: "robot-tune", label: "6. Tune Real Robot" },
                  { value: "field", label: "7. Verify Field" },
                  { value: "maintenance", label: "8. Maintenance" },
                ].map((tab, index) => {
                  const locked = index > furthestIndex
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      aria-disabled={locked}
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

            {/* 1. Connect AdvantageScope to the simulator */}
            <TabsContent value="sim-connect" className="space-y-3">
              <h3 className="text-lg font-semibold">Connect AdvantageScope to the Simulator</h3>

              <Step
                id="sim-connect-1"
                title="Build and start the robot simulator."
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

            {/* 2. Tune in simulation */}
            <TabsContent value="sim-tune" className="space-y-3">
              <h3 className="text-lg font-semibold">Tune the Swerve Drive PID in Simulation</h3>

              <Step
                id="sim-tune-1"
                title="Edit the sim PID gains."
                detail={
                  <>
                    <p>
                      Open <NTPath>modules/pidfproperties_sim.json</NTPath> from your downloaded configuration and
                      edit the drive and angle PID gains.
                    </p>
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
                  filename="modules/pidfproperties_sim.json (excerpt)"
                  before={[
                    { text: '"drive": {' },
                    { text: '  "p": 0.1,' },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}," },
                    { text: '"angle": {' },
                    { text: '  "p": 0.01,' },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}" },
                  ]}
                  after={[
                    { text: '"drive": {' },
                    { text: '  "p": 0.35,', changed: true },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}," },
                    { text: '"angle": {' },
                    { text: '  "p": 0.06,', changed: true },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0.0015', changed: true },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="sim-tune-2"
                title="Restart the simulator to apply the changes."
                checked={checkedSteps.has("sim-tune-2")}
                onCheckedChange={(c) => toggleStep("sim-tune-2", c)}
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

            {/* 3. Connect AdvantageScope to the real robot */}
            <TabsContent value="robot-connect" className="space-y-3">
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

            {/* 4. Module locations */}
            <TabsContent value="locations" className="space-y-3">
              <h3 className="text-lg font-semibold">Module Locations</h3>

              <Step
                id="locations-1"
                title="Know how module location is measured."
                detail="Module locations are measured from the center of the robot to the center of each module (wheel), in inches. Keep this in mind as you go through the next steps."
                checked={checkedSteps.has("locations-1")}
                onCheckedChange={(c) => toggleStep("locations-1", c)}
              >
                <ModuleLocationDiagram />
              </Step>
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
                  filename="modules/frontleft.json (excerpt)"
                  before={[
                    { text: '"location": {' },
                    { text: '  "front": 0,', changed: true },
                    { text: '  "left": 0', changed: true },
                    { text: "}" },
                  ]}
                  after={[
                    { text: '"location": {' },
                    { text: '  "front": 12.5,', changed: true },
                    { text: '  "left": 10.5', changed: true },
                    { text: "}" },
                  ]}
                />
              </Step>
            </TabsContent>

            {/* 5. Align modules */}
            <TabsContent value="align" className="space-y-3">
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
                    <NTPath>NT:/Mechanisms/swerve/[module_name]/azimuth/encoder</NTPath> while it's held in this
                    aligned position, and copy that value into that module's <NTPath>absoluteEncoderOffset</NTPath>.
                  </>
                }
                checked={checkedSteps.has("align-2")}
                onCheckedChange={(c) => toggleStep("align-2", c)}
              >
                <JsonDiff
                  filename="modules/frontleft.json (excerpt)"
                  before={[
                    { text: '"absoluteEncoderOffset": 0,', changed: true },
                    { text: '"absoluteEncoderInverted": false' },
                  ]}
                  after={[
                    { text: '"absoluteEncoderOffset": 173.4,', changed: true },
                    { text: '"absoluteEncoderInverted": false' },
                  ]}
                />
              </Step>
              <Step
                id="align-3"
                title="Confirm the reading is CCW+."
                checked={checkedSteps.has("align-3")}
                onCheckedChange={(c) => toggleStep("align-3", c)}
                detail={
                  <>
                  The absolute encoder reading should be CCW+ (increasing as the module rotates counterclockwise
                    from a top-down view). If it isn't, you need to set that module's{" "}
                    <NTPath>absoluteEncoderInverted</NTPath> to <NTPath>true</NTPath>. This is rare — most absolute
                    encoders already read CCW+ by default, so only change this if you've confirmed the reading is
                    backwards.
                    </>
                }
              >
                <JsonDiff
                  filename="modules/frontleft.json (excerpt)"
                  before={[{ text: '"absoluteEncoderInverted": false', changed: true }]}
                  after={[{ text: '"absoluteEncoderInverted": true', changed: true }]}
                />
              </Step>

              <ExampleProjectNote />
            </TabsContent>

            {/* 6. Tune real robot */}
            <TabsContent value="robot-tune" className="space-y-3">
              <h3 className="text-lg font-semibold">Tune the Real Robot</h3>

              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Lift the robot off the ground first</AlertTitle>
                <AlertDescription>
                  It is very important to initially tune the real robot with the modules elevated off the ground, so
                  they can rotate freely without hitting anything.
                </AlertDescription>
              </Alert>

              <Step
                id="robot-tune-1"
                title="Rotate the robot CCW and check the gyro."
                detail="With the robot off the ground, rotate it CCW (from a top-down view) and confirm the gyro reads CCW+."
                checked={checkedSteps.has("robot-tune-1")}
                onCheckedChange={(c) => toggleStep("robot-tune-1", c)}
              >
                <GyroCheckAnimation />
                <JsonDiff
                  filename="swervedrive.json (excerpt)"
                  before={[{ text: '"gyroInvert": false', changed: true }]}
                  after={[{ text: '"gyroInvert": true', changed: true }]}
                />
              </Step>
              <Step
                id="robot-tune-2"
                title="Tune the real robot's PID gains."
                detail={
                  <>
                    <p>
                      Just like in simulation, edit <NTPath>modules/pidfproperties.json</NTPath> to tune the drive
                      and angle PID gains — this time for the real robot.
                    </p>
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
                        anything on the robot — redeploy the code every time you want to test a change.
                      </li>
                    </ul>
                  </>
                }
                checked={checkedSteps.has("robot-tune-2")}
                onCheckedChange={(c) => toggleStep("robot-tune-2", c)}
              >
                <JsonDiff
                  filename="modules/pidfproperties.json (excerpt)"
                  before={[
                    { text: '"drive": {' },
                    { text: '  "p": 0.1,' },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}," },
                    { text: '"angle": {' },
                    { text: '  "p": 0.01,' },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}" },
                  ]}
                  after={[
                    { text: '"drive": {' },
                    { text: '  "p": 0.28,', changed: true },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0' },
                    { text: "}," },
                    { text: '"angle": {' },
                    { text: '  "p": 0.05,', changed: true },
                    { text: '  "i": 0,' },
                    { text: '  "d": 0.001', changed: true },
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
                        exceedingly high stator current and heats up quickly — that usually means a dead or dying
                        motor.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </Step>
              <Step
                id="robot-tune-3"
                title="Spin each module 5 full turns and check it lands back where it started."
                detail={
                  <>
                    With the robot disabled (motors not fighting you, but telemetry still live) and off the ground,
                    by hand rotate one module's azimuth exactly 5 full turns (360° × 5), then check that module's
                    current state in AdvantageScope — it should read the relatively close same angle it started at. If it
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
                      You can run the same 5-turn test on each drive motor too — rotate the wheel by hand exactly 5
                      full turns and confirm the reported distance traveled matches what you'd expect. This only
                      matters on the real robot — simulation doesn't model gearing mistakes.
                    </p>
                  </>
                }
                checked={checkedSteps.has("robot-tune-3")}
                onCheckedChange={(c) => toggleStep("robot-tune-3", c)}
              >
                <JsonDiff
                  filename="physicalproperties.json (excerpt)"
                  before={[
                    { text: '"gearing": {' },
                    { text: '  "drive": {' },
                    { text: '    "gearRatio": 6.75,' },
                    { text: '    "diameter": 4' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "gearRatio": 12.8' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: '"gearing": {' },
                    { text: '  "drive": {' },
                    { text: '    "gearRatio": 6.75,' },
                    { text: '    "diameter": 4' },
                    { text: "  }," },
                    { text: '  "angle": {' },
                    { text: '    "gearRatio": 21.43', changed: true },
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
                      left/right axis controls angular velocity — left commands the robot to rotate left (CCW),
                      right commands it to rotate right (CW). Verify the robot matches the AdvantageScope swerve
                      widget below (top-down view). Common problems:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Drifts or translates instead of spinning in place:</strong> the wrong CAN IDs for a
                        module, or the wrong absolute encoder offset.
                      </li>
                      <li>
                        <strong>Spins cleanly but the wrong way (CW instead of CCW):</strong>
                        <ul className="mt-1 list-[circle] space-y-1 pl-5">
                          <li>Inverted drive motors.</li>
                          <li>A diagonal module swap — front-left ↔ back-right, front-right ↔ back-left.</li>
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

            {/* 7. Verify field orientation */}
            <TabsContent value="field" className="space-y-3">
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
                          Verify the wiring and CAN IDs are correct first — they're the quickest to rule out. If the
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
                      Spin the robot in place again (right stick held left, CCW) — but this time watch the field
                      widget's heading instead of the swerve module states widget. Common problems:
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        <strong>Drifts or translates instead of spinning in place:</strong> the wrong CAN IDs for a
                        module, or the wrong absolute encoder offset.
                      </li>
                      <li>
                        <strong>Spins cleanly but the wrong way (CW instead of CCW):</strong>
                        <ul className="mt-1 list-[circle] space-y-1 pl-5">
                          <li>Inverted drive motors.</li>
                          <li>A diagonal module swap — front-left ↔ back-right, front-right ↔ back-left.</li>
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
                detail="Rotate the robot so its heading reads about 45°, then test all four cardinal directions again — the robot should still move the same way relative to the driver station, no matter which way its chassis is pointing."
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
                  no loctite/glue on the magnet — if you're using magnetic encoders — on that module. Check that
                  module's build instructions for how to properly loctite/glue the magnet in place, and reapply it.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* 8. Swerve maintenance */}
            <TabsContent value="maintenance" className="space-y-3">
              <h3 className="text-lg font-semibold">Swerve Maintenance</h3>
              <p className="text-sm text-muted-foreground">
                Your swerve drive doesn't stop needing attention once it's tuned — keep these in mind for the rest of
                the season.
              </p>

              <Step
                id="maintenance-1"
                title="Grease the swerve modules regularly."
                detail="Regular greasing keeps modules performing optimally. Don't overgrease them, though — excess grease attracts debris and adds resistance instead of reducing it."
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
                  filename="physicalproperties.json (excerpt)"
                  before={[
                    { text: '"gearing": {' },
                    { text: '  "drive": {' },
                    { text: '    "gearRatio": 6.75,' },
                    { text: '    "diameter": 4' },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                  after={[
                    { text: '"gearing": {' },
                    { text: '  "drive": {' },
                    { text: '    "gearRatio": 6.75,' },
                    { text: '    "diameter": 3.87', changed: true },
                    { text: "  }" },
                    { text: "}" },
                  ]}
                />
              </Step>
              <Step
                id="maintenance-3"
                title="Watch for consistent azimuth angle drift."
                detail="If a module's azimuth angle is consistently off in real life — not just a one-time calibration slip — the gear may be skipping under load, or it may have been replaced with the wrong gear at some point. Recheck that module's gear against the vendor's spec, and rebuild the module if needed."
                checked={checkedSteps.has("maintenance-3")}
                onCheckedChange={(c) => toggleStep("maintenance-3", c)}
              />
            </TabsContent>

            <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border">
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
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {isLastTab ? (
                  <Button asChild className="flex-1 md:flex-none">
                    <Link href="/">Back to Configuration</Link>
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!allStepsChecked} className="flex-1 md:flex-none">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  )
}
