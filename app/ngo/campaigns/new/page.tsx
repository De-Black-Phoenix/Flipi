"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

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

export default function NewCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itemsNeeded, setItemsNeeded] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const addItem = () => {
    if (newItem.trim() && !itemsNeeded.includes(newItem.trim())) {
      setItemsNeeded([...itemsNeeded, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (item: string) => {
    setItemsNeeded(itemsNeeded.filter((i) => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !region || !endDate || itemsNeeded.length === 0) {
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
      router.push("/login");
      return;
    }

    const { data: ngo, error: ngoError } = await supabase
      .from("ngos")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    if (ngoError || !ngo) {
      setLoading(false);
      toast({
        title: "Error",
        description: "NGO not found. Please register your NGO first.",
        variant: "destructive",
      });
      router.push("/ngo/register");
      return;
    }

    const { error } = await supabase.from("campaigns").insert({
      ngo_id: ngo.id,
      title,
      description,
      items_needed: itemsNeeded,
      region,
      end_date: endDate,
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
        description: "Campaign created successfully.",
      });
      router.push("/ngo/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create Campaign</CardTitle>
          <CardDescription>
            Start a new campaign to collect items for your cause
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Winter Clothing Drive"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell people about your campaign..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <SearchableSelect
                  options={REGIONS}
                  value={region}
                  onValueChange={setRegion}
                  placeholder="Search or select region"
                  emptyMessage="No regions found"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items Needed *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Winter coats"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                />
                <Button type="button" onClick={addItem} variant="outline">
                  Add
                </Button>
              </div>
              {itemsNeeded.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {itemsNeeded.map((item, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

