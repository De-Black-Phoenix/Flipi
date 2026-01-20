import { useState, useEffect } from "react";

interface PlatformSettings {
  support_email?: string;
  support_phone?: string;
  about_us?: string;
  privacy_policy?: string;
  terms_of_service?: string;
  instagram_link?: string;
  twitter_link?: string;
  tiktok_link?: string;
  website_link?: string;
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/platform-settings");
        if (!response.ok) throw new Error("Failed to load settings");
        
        const data = await response.json();
        // Transform the data to extract the value property
        const transformedSettings: PlatformSettings = {};
        Object.keys(data).forEach((key) => {
          transformedSettings[key as keyof PlatformSettings] = data[key]?.value || "";
        });
        setSettings(transformedSettings);
      } catch (error) {
        console.error("Error loading platform settings:", error);
        // Use defaults if API fails
        setSettings({
          support_email: "support@flipi.com",
          support_phone: "+233 XX XXX XXXX",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
}

