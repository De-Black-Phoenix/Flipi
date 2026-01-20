"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export default function TermsPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings, loading: settingsLoading } = usePlatformSettings();

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
                Terms of Service
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {settingsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                  <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
                </div>
              </CardContent>
            </Card>
          ) : settings.terms_of_service ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {settings.terms_of_service}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing and using Flipi, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </CardContent>
              </Card>

              {/* Use of Service */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Use of Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Flipi is a platform that connects givers and receivers. You agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Use the platform only for lawful purposes</li>
                    <li>Provide accurate and truthful information</li>
                    <li>Respect other users and maintain a positive community environment</li>
                    <li>Not engage in fraudulent, abusive, or harmful activities</li>
                    <li>Take responsibility for items you give or receive</li>
                  </ul>
                </CardContent>
              </Card>

              {/* User Responsibilities */}
              <Card>
                <CardHeader>
                  <CardTitle>3. User Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Account Security</h3>
                      <p className="text-sm text-muted-foreground">
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                        that occur under your account.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Item Condition</h3>
                      <p className="text-sm text-muted-foreground">
                        You must accurately describe the condition of items you list. Misrepresentation of items may result in 
                        account restrictions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Limitation of Liability */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Flipi acts as a platform to connect users. We are not responsible for the quality, safety, or legality of items 
                    exchanged, nor for the accuracy of user-provided information. Transactions are between users, and Flipi is not 
                    a party to any such transactions.
                  </p>
                </CardContent>
              </Card>

              {/* Modifications */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Modifications to Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes 
                    acceptance of the new terms. We will notify users of significant changes via email or platform notifications.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Contact */}
          {(settings.support_email || settings.support_phone) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  If you have questions about these Terms of Service, please contact us through the platform or email support.
                </p>
                <div className="text-center space-y-2 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">Support Contact</p>
                  <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    {settings.support_email && (
                      <a href={`mailto:${settings.support_email}`} className="text-primary hover:underline">
                        {settings.support_email}
                      </a>
                    )}
                    {settings.support_phone && typeof settings.support_phone === "string" && (
                      <a href={`tel:${settings.support_phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                        {settings.support_phone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

