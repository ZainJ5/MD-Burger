import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FooterInfo from "@/app/models/FooterInfo";
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

function jsonWithNoStore(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

async function processImages(formData) {
  const logoFile = formData.get('logo');
  const sliderImages = formData.getAll('sliderImages');
  const results = { logoPath: null, sliderImagePaths: [] };

  const logoDir = path.join(process.cwd(), 'public');
  const sliderDir = path.join(process.cwd(), 'public', 'footer');

  try {
    if (!existsSync(sliderDir)) {
      await mkdir(sliderDir, { recursive: true });
    }
  } catch (error) {
    throw new Error("Error creating directories: " + error.message);
  }

  if (logoFile && logoFile.size > 0) {
    const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
    const logoPath = path.join(logoDir, 'logo.png');
    await writeFile(logoPath, logoBuffer);
    results.logoPath = '/logo.png';
  }

  if (sliderImages && sliderImages.length > 0) {
    for (const image of sliderImages) {
      if (image.size > 0) {
        const fileExtension = image.name.split('.').pop();
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const filePath = path.join(sliderDir, uniqueFilename);

        const imageBuffer = Buffer.from(await image.arrayBuffer());
        await writeFile(filePath, imageBuffer);
        results.sliderImagePaths.push(`/footer/${uniqueFilename}`);
      }
    }
  }

  return results;
}

async function deleteFileFromDisk(imagePath) {
  if (!imagePath) return;

  try {
    const filePath = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''));

    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
      return true;
    } else {
      console.warn(`File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting file ${imagePath}:`, error);
    return false;
  }
}

export async function GET() {
  try {
    await connectDB();
    const footerInfo = await FooterInfo.findOne({});

    if (!footerInfo) {
      return jsonWithNoStore({
        restaurant: {
          name: "",
          logo: "",
          address: "",
          description: "",
          establishedYear: new Date().getFullYear(),
          mapsLink: ""
        },
        contact: {
          uanNumber: "",
          whatsappNumbers: [],
          openingHours: ""
        },
        appLinks: {
          appStore: "",
          googlePlay: ""
        },
        developer: {
          name: "",
          contact: ""
        },
        sliderImages: []
      });
    }

    return jsonWithNoStore(footerInfo);
  } catch (error) {
    return jsonWithNoStore(
      { message: "Failed to fetch footer information", error: error.message },
      500
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const footerDataString = formData.get('footerData');

    if (!footerDataString) {
      return jsonWithNoStore({ message: "Missing footer data" }, 400);
    }

    const footerData = JSON.parse(footerDataString);
    const { logoPath, sliderImagePaths } = await processImages(formData);

    if (logoPath) {
      footerData.restaurant.logo = logoPath;
    }

    if (sliderImagePaths.length > 0) {
      footerData.sliderImages = [
        ...(footerData.sliderImages || []),
        ...sliderImagePaths
      ];
    }

    const updatedFooter = await FooterInfo.findOneAndUpdate(
      {},
      {
        $set: {
          restaurant: footerData.restaurant,
          contact: footerData.contact,
          appLinks: footerData.appLinks,
          developer: footerData.developer,
          sliderImages: footerData.sliderImages,
          updatedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    return jsonWithNoStore(updatedFooter);
  } catch (error) {
    console.error("Error updating footer:", error);
    return jsonWithNoStore(
      { message: "Failed to update footer information", error: error.message },
      500
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    const { imagePath } = await request.json();
    if (!imagePath) {
      return jsonWithNoStore({ message: "Image path is required" }, 400);
    }

    await deleteFileFromDisk(imagePath);

    const updatedFooter = await FooterInfo.findOneAndUpdate(
      {},
      { $pull: { sliderImages: imagePath } },
      { new: true }
    );

    return jsonWithNoStore(updatedFooter);
  } catch (error) {
    console.error("Error deleting image:", error);
    return jsonWithNoStore(
      { message: "Failed to delete image", error: error.message },
      500
    );
  }
}
