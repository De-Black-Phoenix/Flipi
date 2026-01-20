"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { CheckCircle2, Upload, X, User } from "lucide-react";

const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong Ahafo",
  "Western North",
  "Ahafo",
  "Bono",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
];

// Towns/Cities mapped by region
const REGION_TOWNS: Record<string, string[]> = {
  "Greater Accra": [
    "Accra",
    "Tema",
    "Madina",
    "Adenta",
    "Ashaiman",
    "Dodowa",
    "Nungua",
    "Teshie",
    "Labadi",
    "Osu",
    "Dansoman",
    "Achimota",
    "Legon",
    "East Legon",
    "Cantonments",
    "Airport",
    "Kotobabi",
    "Nima",
    "Mamobi",
    "Kaneshie",
    "Dansoman",
    "Kokomlemle",
    "Adabraka",
    "Jamestown",
    "Chorkor",
    "Tudu",
    "Mallam",
    "Weija",
    "Kasoa",
    "Amasaman",
    "Pokuase",
    "Ablekuma",
    "Dome",
    "Taifa",
    "Kwabenya",
    "Haasto",
    "Dzorwulu",
    "Roman Ridge",
    "Ridge",
    "Labone",
    "Cantonments",
    "Airport Residential",
    "Lartebiokorshie",
    "Dansoman",
    "McCarthy Hill",
    "Sakumono",
    "Tema New Town",
    "Community 1",
    "Community 2",
    "Community 3",
    "Community 4",
    "Community 5",
    "Community 6",
    "Community 7",
    "Community 8",
    "Community 9",
    "Community 10",
    "Community 11",
    "Community 12",
    "Community 13",
    "Community 14",
    "Community 15",
    "Community 16",
    "Community 17",
    "Community 18",
    "Community 19",
    "Community 20",
    "Community 21",
    "Community 22",
    "Community 23",
    "Community 24",
    "Community 25",
    "Other"
  ],
  "Ashanti": [
    "Kumasi",
    "Obuasi",
    "Ejisu",
    "Mampong",
    "Konongo",
    "Asante Mampong",
    "Bekwai",
    "Agona",
    "Nkawie",
    "Tepa",
    "Juaso",
    "Manso Nkwanta",
    "Mamponteng",
    "Fomena",
    "Afigya Sekyere",
    "Afigya Kwabre",
    "Atwima",
    "Atwima Kwanwoma",
    "Atwima Nwabiagya",
    "Bosome Freho",
    "Bosome Freho",
    "Adansi North",
    "Adansi South",
    "Afigya Kwabre",
    "Afigya Sekyere",
    "Ahafo Ano North",
    "Ahafo Ano South",
    "Amansie Central",
    "Amansie West",
    "Asante Akim Central",
    "Asante Akim North",
    "Asante Akim South",
    "Asokore Mampong",
    "Asokwa",
    "Atwima Kwanwoma",
    "Atwima Mponua",
    "Atwima Nwabiagya",
    "Bekwai",
    "Bosome Freho",
    "Bosomtwe",
    "Ejisu",
    "Ejura Sekyedumase",
    "Juaben",
    "Kumasi",
    "Kwabre East",
    "Kwabre West",
    "Mampong",
    "Obuasi",
    "Obuasi East",
    "Obuasi Municipal",
    "Offinso",
    "Offinso North",
    "Offinso South",
    "Sekyere Afram Plains",
    "Sekyere Central",
    "Sekyere East",
    "Sekyere Kumawu",
    "Sekyere South",
    "Suame",
    "Other"
  ],
  "Western": [
    "Sekondi",
    "Takoradi",
    "Tarkwa",
    "Axim",
    "Elubo",
    "Prestea",
    "Bogoso",
    "Dunkwa",
    "Asankragwa",
    "Enchi",
    "Bibiani",
    "Sefwi Wiawso",
    "Sefwi Akontombra",
    "Juabeso",
    "Bia",
    "Bia East",
    "Bia West",
    "Jomoro",
    "Ellembelle",
    "Nzema East",
    "Nzema West",
    "Ahanta West",
    "Ahanta East",
    "Shama",
    "Wassa East",
    "Wassa Amenfi Central",
    "Wassa Amenfi East",
    "Wassa Amenfi West",
    "Mpohor",
    "Tarkwa Nsuaem",
    "Prestea Huni Valley",
    "Other"
  ],
  "Eastern": [
    "Koforidua",
    "Nkawkaw",
    "Akim Oda",
    "Suhum",
    "Nsawam",
    "Aburi",
    "Mampong",
    "Asamankese",
    "Akim Swedru",
    "Akim Achiase",
    "Akim Oda",
    "Akim Swedru",
    "Akuapim North",
    "Akuapim South",
    "Akyemansa",
    "Asuogyaman",
    "Atiwa",
    "Ayensuano",
    "Birim Central",
    "Birim North",
    "Birim South",
    "Denkyembour",
    "East Akim",
    "Fanteakwa",
    "Kwaebibirem",
    "Kwahu East",
    "Kwahu North",
    "Kwahu South",
    "Kwahu West",
    "Lower Manya Krobo",
    "New Juaben",
    "Nsawam Adoagyiri",
    "Suhum Kraboa Coaltar",
    "Upper Manya Krobo",
    "Upper West Akim",
    "West Akim",
    "Yilo Krobo",
    "Other"
  ],
  "Central": [
    "Cape Coast",
    "Winneba",
    "Saltpond",
    "Elmina",
    "Kasoa",
    "Agona Swedru",
    "Mankessim",
    "Dunkwa",
    "Assin Foso",
    "Twifo Praso",
    "Abura Asebu Kwamankese",
    "Agona East",
    "Agona West",
    "Ajumako Enyan Essiam",
    "Asikuma Odoben Brakwa",
    "Assin Central",
    "Assin North",
    "Assin South",
    "Awutu Senya",
    "Awutu Senya East",
    "Cape Coast",
    "Effutu",
    "Ekumfi",
    "Gomoa East",
    "Gomoa West",
    "Komenda Edina Eguafo Abirem",
    "Mfantseman",
    "Twifo Atti Morkwa",
    "Twifo Hemang Lower Denkyira",
    "Upper Denkyira East",
    "Upper Denkyira West",
    "Other"
  ],
  "Volta": [
    "Ho",
    "Hohoe",
    "Keta",
    "Aflao",
    "Kpandu",
    "Jasikan",
    "Kadjebi",
    "Nkwanta",
    "Dambai",
    "Adidome",
    "Sogakope",
    "Akatsi",
    "Aveglo",
    "Adaklu",
    "Agotime Ziope",
    "Akatsi North",
    "Akatsi South",
    "Anloga",
    "Biakoye",
    "Central Tongu",
    "Ho",
    "Ho West",
    "Hohoe",
    "Jasikan",
    "Kadjebi",
    "Keta",
    "Ketu North",
    "Ketu South",
    "Kpandu",
    "Krachi East",
    "Krachi Nchumuru",
    "Krachi West",
    "Nkwanta North",
    "Nkwanta South",
    "North Dayi",
    "North Tongu",
    "South Dayi",
    "South Tongu",
    "Other"
  ],
  "Northern": [
    "Tamale",
    "Yendi",
    "Savelugu",
    "Bimbilla",
    "Walewale",
    "Gushegu",
    "Karaga",
    "Kpandae",
    "Sang",
    "Tolon",
    "Kumbungu",
    "Nanton",
    "Mion",
    "Saboba",
    "Chereponi",
    "Zabzugu",
    "Tatale",
    "Bunkpurugu",
    "Nakpanduri",
    "Gushiegu",
    "Karaga",
    "Kpandai",
    "Nanumba North",
    "Nanumba South",
    "Sagnarigu",
    "Savelugu Nanton",
    "Tamale",
    "Tatale Sanguli",
    "Tolon",
    "Yendi",
    "Zabzugu",
    "Other"
  ],
  "Upper East": [
    "Bolgatanga",
    "Bawku",
    "Navrongo",
    "Bongo",
    "Bawku West",
    "Binduri",
    "Bolgatanga Central",
    "Bolgatanga East",
    "Bolgatanga Municipal",
    "Bongo",
    "Builsa North",
    "Builsa South",
    "Garu",
    "Kassena Nankana East",
    "Kassena Nankana West",
    "Nabdam",
    "Pusiga",
    "Talensi",
    "Tempane",
    "Other"
  ],
  "Upper West": [
    "Wa",
    "Tumu",
    "Lawra",
    "Nadowli",
    "Jirapa",
    "Lambussie",
    "Sissala East",
    "Sissala West",
    "Wa East",
    "Wa Municipal",
    "Wa West",
    "Other"
  ],
  "Brong Ahafo": [
    "Sunyani",
    "Techiman",
    "Wenchi",
    "Berekum",
    "Dormaa Ahenkro",
    "Goaso",
    "Kintampo",
    "Nkoranza",
    "Atebubu",
    "Yeji",
    "Jaman North",
    "Jaman South",
    "Tain",
    "Banda",
    "Berekum East",
    "Berekum West",
    "Dormaa Central",
    "Dormaa East",
    "Dormaa West",
    "Jaman North",
    "Jaman South",
    "Sunyani",
    "Sunyani Municipal",
    "Sunyani West",
    "Tain",
    "Techiman",
    "Techiman North",
    "Techiman South",
    "Wenchi",
    "Other"
  ],
  "Western North": [
    "Sefwi Wiawso",
    "Bibiani",
    "Juabeso",
    "Bia East",
    "Bia West",
    "Aowin",
    "Suaman",
    "Other"
  ],
  "Ahafo": [
    "Goaso",
    "Kenyasi",
    "Hwidiem",
    "Duayaw Nkwanta",
    "Bechem",
    "Tepa",
    "Other"
  ],
  "Bono": [
    "Sunyani",
    "Berekum",
    "Dormaa Ahenkro",
    "Wenchi",
    "Jaman North",
    "Jaman South",
    "Tain",
    "Banda",
    "Other"
  ],
  "Bono East": [
    "Techiman",
    "Kintampo",
    "Nkoranza",
    "Atebubu",
    "Yeji",
    "Prang",
    "Other"
  ],
  "Oti": [
    "Dambai",
    "Jasikan",
    "Kadjebi",
    "Krachi East",
    "Krachi Nchumuru",
    "Krachi West",
    "Nkwanta North",
    "Nkwanta South",
    "Other"
  ],
  "Savannah": [
    "Damongo",
    "Bole",
    "Sawla",
    "Larabanga",
    "Other"
  ],
  "North East": [
    "Nalerigu",
    "Gambaga",
    "Walewale",
    "Wulugu",
    "Other"
  ],
};

const MOTIVATION_OPTIONS = [
  "I want to give out items I no longer need",
  "I'm looking for help with items I can't afford",
  "I want to support people and causes in my community",
  "Just exploring for now",
];

const DISCOVERY_OPTIONS = [
  "Friend or family",
  "Social media",
  "School / community group",
  "Online search",
  "Other",
];

const EXPECTATION_OPTIONS = [
  "Connecting with generous people nearby",
  "Finding support when I need it",
  "Making a positive impact locally",
  "All of the above",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [motivation, setMotivation] = useState("");
  const [discovery, setDiscovery] = useState("");
  const [expectation, setExpectation] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Handle profile picture upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setProfilePictureUrl(data.secure_url);
      toast({
        title: "Success!",
        description: "Profile picture uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }

    setUploading(false);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Custom auth check that doesn't redirect immediately - allows email verification sessions to establish
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 10; // More retries for email verification

    const checkAuth = async () => {
      try {
        // Check for session with retries (email verification might need a moment)
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            setAuthLoading(false);
          } else if (retryCount < maxRetries) {
            // Retry to allow session to establish after email verification
            retryCount++;
            setTimeout(checkAuth, 300);
          } else {
            // After max retries, stop loading but don't redirect
            // User can still see the page and session might establish via auth state change
            setAuthLoading(false);
          }
        }
      } catch (error) {
        if (mounted && retryCount >= maxRetries) {
          setAuthLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes - this will catch the session when it's established
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (!user) return;

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace("/find");
      }
    };

    checkOnboarding();
  }, [user, supabase, router]);

  const handleComplete = async () => {
    if (!profilePictureUrl || !region || !town || !motivation || !discovery || !expectation) {
      toast({
        title: "Please complete all fields",
        description: "Make sure to upload a profile picture and fill in all required information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Industry standard: Use session first (most reliable)
      // getSession() checks cookies directly and is synchronous
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        // Fallback: Try getUser() which refreshes the session
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          toast({
            title: "Authentication required",
            description: "Your session has expired. Please refresh the page and try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Prepare onboarding data
      const onboardingData = {
        avatar_url: profilePictureUrl,
        region,
        town,
        onboarding_responses: {
          motivation,
          discovery,
          expectation,
        },
      };

      // Industry standard: Use server-side API route for critical operations
      // This ensures proper session handling and RLS enforcement
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to complete onboarding";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse response (should only happen if response is ok)
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response is ok but JSON parsing fails, still consider it success
        // (redirect will happen anyway)
        console.warn("Could not parse response JSON, but status was ok:", jsonError);
      }

      // Success - set loading to false before redirect
      setLoading(false);

      // Redirect to home page
      try {
        window.location.assign("/home?welcome=true");
      } catch (redirectError) {
        // If redirect fails, use router as fallback
        console.warn("window.location.assign failed, using router:", redirectError);
        router.push("/home?welcome=true");
      }
    } catch (error: any) {
      console.error("Onboarding completion error:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Step 1: Profile Picture Upload
  // Note: We don't block the page with loading - allow user to see onboarding while session establishes
  // The auth state change listener will update when session is ready
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white animate-in fade-in duration-300">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">Step 1 of 3</span>
            </div>
            <CardTitle className="text-3xl mb-2">Welcome to Flipi! 🐬</CardTitle>
            <CardDescription className="text-base">
              Let&apos;s set up your profile. First, upload a profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              {profilePictureUrl ? (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary">
                    <Image
                      src={profilePictureUrl}
                      alt="Profile picture"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <button
                    onClick={() => setProfilePictureUrl("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    aria-label="Remove profile picture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-primary/5"
                  } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {isDragActive ? "Drop your image here" : "Upload profile picture"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Drag and drop or click to select
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!profilePictureUrl || uploading}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Location Setup
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white animate-in fade-in duration-300">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">Step 2 of 3</span>
            </div>
            <CardTitle className="text-3xl">Where are you located?</CardTitle>
            <CardDescription>
              Tell us where you&apos;re located so we can connect you with your community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <SearchableSelect
                options={REGIONS}
                value={region}
                onValueChange={(value) => {
                  setRegion(value);
                  setTown(""); // Clear town when region changes
                }}
                placeholder="Search or select your region"
                emptyMessage="No regions found"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="town">Town/City</Label>
              <SearchableSelect
                options={region && REGION_TOWNS[region] ? REGION_TOWNS[region] : []}
                value={town}
                onValueChange={setTown}
                placeholder={region ? "Search or select your town/city" : "Select a region first"}
                disabled={!region}
                emptyMessage={region ? "No towns found" : "Select a region first"}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!region || !town}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Questionnaire
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white animate-in fade-in duration-300">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">Step 3 of 3</span>
          </div>
          <CardTitle className="text-3xl">Almost there!</CardTitle>
          <CardDescription>
            Help us understand what brings you to Flipi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>What brings you to Flipi?</Label>
            <Select value={motivation} onValueChange={setMotivation}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>How did you hear about Flipi?</Label>
            <Select value={discovery} onValueChange={setDiscovery}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {DISCOVERY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>What do you hope Flipi helps you with?</Label>
            <Select value={expectation} onValueChange={setExpectation}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {EXPECTATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1"
              disabled={loading || !motivation || !discovery || !expectation}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Completing...
                </div>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
