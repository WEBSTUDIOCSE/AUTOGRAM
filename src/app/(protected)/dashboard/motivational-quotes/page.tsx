import { redirect } from "next/navigation";
import { MotivationalQuoteSettings, MotivationalQuoteHistory, MotivationalQuoteGenerator } from "@/components/module9";
import { getCurrentUser } from "@/lib/auth/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MotivationalQuotesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Motivational Quotes Auto Poster</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Automatically generate and post motivational quotes to Instagram
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="generate" className="text-xs sm:text-sm px-2 sm:px-4">Generate</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-4">Settings</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <MotivationalQuoteGenerator />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <MotivationalQuoteSettings />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MotivationalQuoteHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
