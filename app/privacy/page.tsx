"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Database, UserCheck, ArrowLeft } from "lucide-react";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
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
          ) : settings.privacy_policy ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {settings.privacy_policy}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Information We Collect</CardTitle>
                  <CardDescription>
                    We collect information to provide and improve our services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Account Information</h3>
                      <p className="text-sm text-muted-foreground">
                        When you create an account, we collect your email address, name, and profile information you choose to provide.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Usage Data</h3>
                      <p className="text-sm text-muted-foreground">
                        We collect information about how you use Flipi, including items you list, requests you make, and interactions with other users.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How We Use Information */}
              <Card>
                <CardHeader>
                  <CardTitle>2. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>To provide and maintain our service</li>
                    <li>To notify you about changes to our service</li>
                    <li>To allow you to participate in interactive features</li>
                    <li>To provide customer support</li>
                    <li>To gather analysis or valuable information to improve our service</li>
                    <li>To monitor the usage of our service</li>
                    <li>To detect, prevent and address technical issues</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card>
                <CardHeader>
                  <CardTitle>3. Data Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Protection Measures</h3>
                      <p className="text-sm text-muted-foreground">
                        We implement appropriate security measures to protect your personal information. However, no method of transmission 
                        over the internet is 100% secure, and we cannot guarantee absolute security.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Data Sharing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect and defend our rights or property</li>
                    <li>With service providers who assist us in operating our platform</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Your Privacy Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Access and Control</h3>
                      <p className="text-sm text-muted-foreground">
                        You have the right to access, update, or delete your personal information at any time through your account settings. 
                        You can also request a copy of your data or request deletion of your account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cookies */}
              <Card>
                <CardHeader>
                  <CardTitle>6. Cookies and Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    We use cookies and similar tracking technologies to track activity on our platform and store certain information. 
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
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
                  If you have questions about this Privacy Policy, please contact us through the platform or email support.
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

