import { createClient } from "@supabase/supabase-js";

const bucketName = "lesson-note-images";
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY para provisionar o bucket.");
  process.exitCode = 1;
} else {
  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const options = {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  };
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const result = buckets.some((bucket) => bucket.id === bucketName)
    ? await supabase.storage.updateBucket(bucketName, options)
    : await supabase.storage.createBucket(bucketName, options);

  if (result.error) throw result.error;
  console.log(`Bucket ${bucketName} provisionado como público, com limites de tipo e tamanho.`);
}
