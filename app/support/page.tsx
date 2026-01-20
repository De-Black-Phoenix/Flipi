"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HelpCircle, Mail, FileText, ArrowLeft, PhoneCall } from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let scrollContainer: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 100);
      } else {
        setIsScrolled(window.scrollY > 100);
      }
    };

    // Find the scroll container (AppShell scroll container)
    timeoutId = setTimeout(() => {
      scrollContainer = document.querySelector('main div.overflow-y-auto') as HTMLElement;
      const target = scrollContainer || window;
      
      target.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-12">
        {/* Back Button - Fixed at top */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/40 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {isScrolled && (
              <h1 className="text-lg font-semibold text-foreground transition-opacity duration-200">
                Support
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Get assistance with your account, transactions, or platform questions.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {settings.support_email && (
            <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send us an email and we'll get back to you within 24 hours
                </p>
                <a 
                  href={`mailto:${settings.support_email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {settings.support_email}
                </a>
              </CardContent>
            </Card>
          )}

          {settings.support_phone && (
            <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <PhoneCall className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Call our support team for immediate assistance
                </p>
                <a 
                  href={`tel:${typeof settings.support_phone === "string" ? settings.support_phone.replace(/\s/g, "") : settings.support_phone}`}
                  className="text-primary hover:underline font-medium"
                >
                  {settings.support_phone}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How do I give an item?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click "Give Item" in the navigation, fill out the item details, upload photos, and set your location. 
                Once posted, interested receivers can request your item.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I request an item?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse available items using the "Find Items" page, click on an item you're interested in, 
                and click "Request Item" to start a conversation with the giver.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does the point system work?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You earn 1 point for each item you give, and 5 points for campaign donations. 
                Points determine your rank, which builds trust in the community. 
                Check out our <Link href="/points" className="text-primary hover:underline">Points & Ranks</Link> page for more details.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a cost to use Flipi?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Flipi is completely free for regular item exchanges. However, campaign donations may include 
                processing fees as specified during the donation process.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I update my profile?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Go to your profile by clicking on your profile card in the sidebar, or visit Settings from 
                the dropdown menu to update your information, avatar, and preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Helpful Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Helpful Resources</CardTitle>
            <CardDescription>
              Explore our platform guides and policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/about" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">About Flipi</h3>
                      <p className="text-xs text-muted-foreground">Learn more about our mission</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/points" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Points & Ranks</h3>
                      <p className="text-xs text-muted-foreground">Understand the gamification system</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/terms" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Terms of Service</h3>
                      <p className="text-xs text-muted-foreground">Read our terms and conditions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/privacy" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Privacy Policy</h3>
                      <p className="text-xs text-muted-foreground">How we protect your data</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Need More Help?</h3>
              <p className="text-muted-foreground mb-6">
                Our support team is available to assist you with any questions or concerns
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@flipi.com" className="text-primary hover:underline">
                    support@flipi.com
                  </a>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <PhoneCall className="w-4 h-4" />
                  <a href="tel:+233XXXXXXXXX" className="text-primary hover:underline">
                    +233 XX XXX XXXX
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

