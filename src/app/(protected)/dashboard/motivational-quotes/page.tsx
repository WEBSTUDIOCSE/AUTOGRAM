import { redirect } from "next/navigation";
import { MotivationalQuoteSettings } from "@/components/module9/MotivationalQuoteSettings";
import { MotivationalQuoteHistory } from "@/components/module9/MotivationalQuoteHistory";
import { getCurrentUser } from "@/lib/auth/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MotivationalQuotesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Motivational Quotes Auto Poster</h1>
        <p className="text-muted-foreground">
          Automatically generate and post motivational quotes to Instagram
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

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
