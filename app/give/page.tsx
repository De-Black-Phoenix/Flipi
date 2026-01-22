"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";

const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Furniture",
  "Books",
  "Toys",
  "Kitchen Items",
  "Sports Equipment",
  "Arts",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

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
    "Airport Residential",
    "Lartebiokorshie",
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

export default function GiveItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const { loading: authLoading } = useAuthGuard({ requireAuth: true, redirectTo: "/signup" });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
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
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }

    setUploading(false);
  }, [images, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 5 - images.length,
  });

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Render immediately - auth is non-blocking

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !condition || !region || !town) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/signup");
      return;
    }

    const { error } = await supabase.from("items").insert({
      owner_id: user.id,
      title,
      description,
      category,
      condition,
      images,
      region,
      town,
      campaign_id: campaignId || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your item has been listed.",
      });
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-20 md:pb-12 max-w-2xl mx-auto animate-in fade-in duration-300">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2 md:space-y-3">
            <Label htmlFor="title" className="text-xs md:text-sm">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Vintage Coffee Table"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:space-y-3">
            <Label htmlFor="description" className="text-xs md:text-sm">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell us about the item..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-base md:text-sm min-h-[80px] md:min-h-[100px]"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="category" className="text-xs md:text-sm">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="h-8 md:h-10 text-base md:text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="condition" className="text-xs md:text-sm">Condition *</Label>
              <Select value={condition} onValueChange={setCondition} required>
                <SelectTrigger className="h-8 md:h-10 text-base md:text-sm">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <Label className="text-xs md:text-sm">Images (up to 5)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? "Drop images here"
                  : "Drag & drop images here, or click to select"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            {uploading && (
              <p className="text-sm text-gray-500 text-center">Uploading...</p>
            )}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden max-w-[120px]">
                    <Image
                      src={url}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="region" className="text-xs md:text-sm">Region *</Label>
              <SearchableSelect
                options={REGIONS}
                value={region}
                onValueChange={(value) => {
                  setRegion(value);
                  setTown(""); // Clear town when region changes
                }}
                placeholder="Search or select region"
                emptyMessage="No regions found"
                className="h-8 md:h-10 [&_input]:text-base [&_input]:md:text-sm"
              />
            </div>

            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="town" className="text-xs md:text-sm">Town/City *</Label>
              <SearchableSelect
                options={region && REGION_TOWNS[region] ? REGION_TOWNS[region] : []}
                value={town}
                onValueChange={setTown}
                placeholder={region ? "Search or select your town/city" : "Select a region first"}
                disabled={!region}
                emptyMessage={region ? "No towns found" : "Select a region first"}
                className="h-8 md:h-10 [&_input]:text-base [&_input]:md:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="w-auto" size="lg" disabled={loading || uploading}>
              {loading || uploading ? (
                <span>{uploading ? "Uploading images..." : "Listing item..."}</span>
              ) : (
                "List Item"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

