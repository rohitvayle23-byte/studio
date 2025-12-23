"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Power,
  BatteryFull,
  Lightbulb,
  Zap,
  AlertTriangle,
  Palette,
  BatteryMedium,
  BatteryLow
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const [torchOn, setTorchOn] = useState(false);
  const [mode, setMode] = useState<Mode>("normal");
  const [color, setColor] = useState(COLORS[0]);
  const [strobeFrequency, setStrobeFrequency] = useState(5);
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [brightness, setBrightness] = useState(100);
  const [sosStep, setSosStep] = useState(0);
  const [isSosOn, setIsSosOn] = useState(false);

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
    const glowOpacity = brightness / 100;
    const baseColor = color === '#FFFFFF' ? '260, 100%, 85%' : 'var(--accent)';
    return {
      backgroundColor: color,
      boxShadow: `
        0 0 ${10 * glowOpacity}px 5px ${color}33,
        0 0 ${30 * glowOpacity}px 15px ${color}22,
        0 0 ${80 * glowOpacity}px 40px ${color}11,
        inset 0 0 ${20 * glowOpacity}px 0px ${color}88
      `,
      opacity: glowOpacity
    };
  }, [isLightVisible, color, brightness]);

  
  const torchWrapperStyle = useMemo(() => {
    if (!isLightVisible) return { opacity: 0.1, filter: 'blur(10px)' };
     if (mode === 'strobe') {
        return {
            opacity: 1,
            '--strobe-duration': `${currentStrobeDuration}s`,
            transition: 'opacity 0.1s ease-in-out, filter 0.3s ease-in-out',
            filter: 'blur(0px)'
        } as React.CSSProperties
     }
    return { 
        opacity: brightness / 100,
        transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
        filter: 'blur(0px)'
    };
  }, [isLightVisible, mode, brightness, currentStrobeDuration]);

  const BatteryIcon = useMemo(() => {
    if (batteryLevel > 60) return <BatteryFull className="text-green-400" />;
    if (batteryLevel > 20) return <BatteryMedium className="text-yellow-400" />;
    return <BatteryLow className="text-red-500" />;
  }, [batteryLevel]);

  return (
    <main className="flex flex-col items-center min-h-screen w-full p-4 sm:p-6 lg:p-8 overflow-hidden">
      <header className="w-full max-w-md flex justify-between items-center mb-6 z-10">
        <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-white to-accent text-transparent bg-clip-text">
          Illumine
        </h1>
        <div className="flex items-center gap-2 text-lg font-medium p-2 rounded-lg bg-card/50 backdrop-blur-sm">
          {BatteryIcon}
          <span>{batteryLevel}%</span>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center w-full">
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full transition-all duration-300 ${mode === 'strobe' && isLightVisible ? 'animate-strobe' : ''}`}
          style={{
            ...torchGlow,
            ...torchWrapperStyle
          } as React.CSSProperties}
        />
      </div>

      <div className="w-full max-w-md space-y-6 mt-6 z-10">
        <Button
          onClick={() => setTorchOn((v) => !v)}
          className="w-full h-20 rounded-full text-2xl font-bold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
          aria-label="Toggle Flashlight"
        >
          <Power className={`mr-2 h-8 w-8 transition-colors ${torchOn ? 'text-accent' : ''}`} />
          {torchOn ? "ON" : "OFF"}
        </Button>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border backdrop-blur-sm">
            <TabsTrigger value="normal">Control</TabsTrigger>
            <TabsTrigger value="strobe">Strobe</TabsTrigger>
            <TabsTrigger value="sos">SOS</TabsTrigger>
          </TabsList>
          <TabsContent value="normal" className="mt-4">
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb size={20}/> Manual Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="brightness" className="flex items-center gap-2"><Lightbulb size={16}/> Flashlight Brightness: {brightness}%</Label>
                  <Slider id="brightness" value={[brightness]} onValueChange={([v]) => setBrightness(v)} max={100} step={1} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="battery" className="flex items-center gap-2"><BatteryFull size={16}/> Battery Level: {batteryLevel}%</Label>
                  <Slider id="battery" value={[batteryLevel]} onValueChange={([v]) => setBatteryLevel(v)} max={100} step={1} />
                </div>
                <Separator />
                <div>
                   <Label className="flex items-center gap-2 mb-4"><Palette size={16}/> Color Filter</Label>
                   <div className="flex justify-around">
                    {COLORS.map((c) => (
                      <Button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110 shadow-lg' : 'border-transparent opacity-70'}`}
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
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap size={20}/> Strobe Control</CardTitle>
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
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle size={20}/> Emergency Signal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                    When SOS mode is active and the torch is on, it will automatically flash the universal ...---... signal.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
