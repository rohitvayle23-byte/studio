"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Power,
  BatteryFull,
  Sun,
  Lightbulb,
  Zap,
  AlertTriangle,
  Palette,
  Bot,
  Loader2,
  BatteryMedium,
  BatteryLow,
  WifiOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  optimizeBrightness,
  OptimizeBrightnessInput,
  OptimizeBrightnessOutput,
} from "@/ai/flows/optimize-brightness";
import {
  provideDistressSignal,
  ProvideDistressSignalInput,
  ProvideDistressSignalOutput,
} from "@/ai/flows/provide-distress-signal";

type Mode = "normal" | "strobe" | "sos";
const COLORS = ["#FFFFFF", "#FF5C5C", "#FFD700", "#5C96FF"];

const sosPattern = [
  { duration: 200, on: true }, { duration: 200, on: false },
  { duration: 200, on: true }, { duration: 200, on: false },
  { duration: 200, on: true }, { duration: 600, on: false },
  { duration: 600, on: true }, { duration: 200, on: false },
  { duration: 600, on: true }, { duration: 200, on: false },
  { duration: 600, on: true }, { duration: 600, on: false },
  { duration: 200, on: true }, { duration: 200, on: false },
  { duration: 200, on: true }, { duration: 200, on: false },
  { duration: 200, on: true }, { duration: 3000, on: false },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [mode, setMode] = useState<Mode>("normal");
  const [color, setColor] = useState(COLORS[0]);
  const [strobeFrequency, setStrobeFrequency] = useState(5);
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [ambientLight, setAmbientLight] = useState(500);
  const [userPreference, setUserPreference] = useState(70);
  const [sosStep, setSosStep] = useState(0);
  const [isSosOn, setIsSosOn] = useState(false);

  const [aiBrightness, setAiBrightness] =
    useState<OptimizeBrightnessOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(true);

  const [distressSignal, setDistressSignal] =
    useState<ProvideDistressSignalOutput | null>(null);
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false);
  const [location, setLocation] = useState("40.7128, -74.0060");
  const [environment, setEnvironment] = useState("urban");

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const debouncedOptimizeBrightness = useCallback(async (input: OptimizeBrightnessInput) => {
    setIsOptimizing(true);
    try {
      const result = await optimizeBrightness(input);
      setAiBrightness(result);
    } catch (error) {
      console.error("Error optimizing brightness:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get brightness optimization.",
      });
      setAiBrightness(null);
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedOptimizeBrightness({
        ambientLightLevel: ambientLight,
        currentBatteryPercentage: batteryLevel,
        userBrightnessPreference: userPreference,
      });
    }, 500);

    return () => clearTimeout(handler);
  }, [ambientLight, batteryLevel, userPreference, debouncedOptimizeBrightness]);

  useEffect(() => {
    if (mode !== 'sos' || !torchOn) {
      setIsSosOn(false);
      return;
    }
    const currentStepConfig = sosPattern[sosStep % sosPattern.length];
    setIsSosOn(currentStepConfig.on);
    const timeoutId = setTimeout(() => {
        setSosStep(prev => prev + 1);
    }, currentStepConfig.duration);

    return () => clearTimeout(timeoutId);
  }, [torchOn, mode, sosStep]);

  const handleGenerateSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingSignal(true);
    setDistressSignal(null);
    try {
      const result = await provideDistressSignal({ location, environment });
      setDistressSignal(result);
    } catch (error) {
      console.error("Error generating signal:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate distress signal.",
      });
    } finally {
      setIsGeneratingSignal(false);
    }
  };

  const currentStrobeDuration = useMemo(
    () => (11 - strobeFrequency) * 0.1,
    [strobeFrequency]
  );

  const isLightVisible = useMemo(() => {
    if (!torchOn) return false;
    if (mode === 'sos') return isSosOn;
    return true;
  }, [torchOn, mode, isSosOn]);

  const torchGlow = useMemo(() => {
    if (!isLightVisible) return {};
    return {
      boxShadow: `0 0 80px 20px ${color}, 0 0 120px 40px ${color}33`,
      backgroundColor: color,
    };
  }, [isLightVisible, color]);

  const BatteryIcon = useMemo(() => {
    if (batteryLevel > 75) return <BatteryFull className="text-accent" />;
    if (batteryLevel > 25) return <BatteryMedium className="text-yellow-400" />;
    return <BatteryLow className="text-red-500" />;
  }, [batteryLevel]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8 overflow-hidden">
      <header className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-white to-accent text-transparent bg-clip-text">
          IllumineAI
        </h1>
        <div className="flex items-center gap-2 text-lg font-medium">
          {BatteryIcon}
          <span>{batteryLevel}%</span>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center w-full">
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full transition-all duration-500 ${mode === 'strobe' && isLightVisible ? 'animate-strobe' : ''}`}
          style={{
            ...torchGlow,
            opacity: isLightVisible ? 1 : 0.1,
            '--strobe-duration': `${currentStrobeDuration}s`,
          } as React.CSSProperties}
        />
      </div>

      <div className="w-full max-w-md space-y-6 mt-6">
        <Button
          onClick={() => setTorchOn((v) => !v)}
          className="w-full h-20 rounded-full text-2xl font-bold shadow-lg bg-primary hover:bg-primary/90 active:scale-95 transition-transform"
          aria-label="Toggle Flashlight"
        >
          <Power className="mr-2 h-8 w-8" />
          {torchOn ? "ON" : "OFF"}
        </Button>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="normal">Control</TabsTrigger>
            <TabsTrigger value="strobe">Strobe</TabsTrigger>
            <TabsTrigger value="sos">SOS</TabsTrigger>
          </TabsList>
          <TabsContent value="normal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> AI Brightness</CardTitle>
                <CardDescription>
                  Dynamically adjusts brightness for visibility and battery life.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ambient" className="flex items-center gap-2"><Sun size={16}/> Ambient Light: {ambientLight} lux</Label>
                  <Slider id="ambient" value={[ambientLight]} onValueChange={([v]) => setAmbientLight(v)} max={2000} step={50} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="battery" className="flex items-center gap-2"><BatteryFull size={16}/> Battery Level: {batteryLevel}%</Label>
                  <Slider id="battery" value={[batteryLevel]} onValueChange={([v]) => setBatteryLevel(v)} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preference" className="flex items-center gap-2"><Lightbulb size={16}/> User Preference: {userPreference}%</Label>
                  <Slider id="preference" value={[userPreference]} onValueChange={([v]) => setUserPreference(v)} max={100} step={1} />
                </div>
                 {isOptimizing ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <span className="ml-2">AI is thinking...</span>
                    </div>
                ) : aiBrightness ? (
                  <Card className="bg-background/50">
                    <CardHeader>
                        <CardTitle className="text-base">AI Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label>Screen Brightness: {aiBrightness.screenBrightness}%</Label>
                            <Progress value={aiBrightness.screenBrightness} className="h-2 mt-1" />
                        </div>
                        <div>
                            <Label>Flashlight Strength: {aiBrightness.flashlightStrength}%</Label>
                            <Progress value={aiBrightness.flashlightStrength} className="h-2 mt-1" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <CardDescription>{aiBrightness.reasoning}</CardDescription>
                    </CardFooter>
                  </Card>
                ) : (
                    <Alert variant="destructive">
                        <WifiOff className="h-4 w-4" />
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>The AI assistant is currently unavailable.</AlertDescription>
                    </Alert>
                )}
                <Separator />
                <div>
                   <Label className="flex items-center gap-2 mb-4"><Palette size={16}/> Color Filter</Label>
                   <div className="flex justify-around">
                    {COLORS.map((c) => (
                      <Button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Set color to ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="strobe" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap /> Strobe Control</CardTitle>
                <CardDescription>Adjust the frequency of the strobe light.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Slider id="frequency" value={[strobeFrequency]} onValueChange={([v]) => setStrobeFrequency(v)} min={1} max={10} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Slow</span>
                        <span>Fast</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle/> Emergency Signal</CardTitle>
                 <CardDescription>
                  Activate an SOS signal or generate a location-specific distress pattern.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateSignal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Lat, Long)</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Input id="environment" value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g., mountain, sea, urban" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isGeneratingSignal}>
                    {isGeneratingSignal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Distress Signal
                  </Button>
                </form>

                {isGeneratingSignal && (
                    <div className="flex items-center justify-center p-4 mt-4">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <span className="ml-2">AI is determining signal...</span>
                    </div>
                )}
                
                {distressSignal && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{distressSignal.signalPattern}</AlertTitle>
                    <AlertDescription>{distressSignal.signalDescription}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
