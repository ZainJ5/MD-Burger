import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import HeroSection from "@/app/models/HeroSection";
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Content-Type': 'application/json'
};

async function processHeroImages(formData) {
  const images = formData.getAll('images');
  const imagePaths = [];
  const imageDir = path.join(process.cwd(), 'public', 'hero');

  try {
    if (!existsSync(imageDir)) {
      await mkdir(imageDir, { recursive: true });
    }
  } catch (error) {
    throw new Error("Error creating directory: " + error.message);
  }

  if (images && images.length > 0) {
    for (const image of images) {
      if (image.size > 0) {
        const fileExtension = image.name.split('.').pop();
        const uniqueFilename = `hero-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const filePath = path.join(imageDir, uniqueFilename);

        const imageBuffer = Buffer.from(await image.arrayBuffer());
        await writeFile(filePath, imageBuffer);
        imagePaths.push(`/hero/${uniqueFilename}`);
      }
    }
  }

  return imagePaths;
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
    const heroData = await HeroSection.findOne({});

    const data = heroData || {
      banners: [
        'Welcome to Tipu Burger & Broast',
        'Flat 10% Off on all Items',
        'Discover Our Special Dishes',
      ],
      images: ['/hero.jpg', '/hero-2.jpg', '/hero-3.jpg'],
      settings: {
        bannerRotationSpeed: 3000,
        imageRotationSpeed: 5000,
      }
    };

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: noCacheHeaders,
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        message: "Failed to fetch hero section data",
        error: error.message,
      }),
      {
        status: 500,
        headers: noCacheHeaders,
      }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const heroDataString = formData.get('heroData');

    if (!heroDataString) {
      return new NextResponse(JSON.stringify({ message: "Missing hero data" }), {
        status: 400,
        headers: noCacheHeaders,
      });
    }

    const heroData = JSON.parse(heroDataString);
    const newImagePaths = await processHeroImages(formData);

    if (newImagePaths.length > 0) {
      heroData.images = [...(heroData.images || []), ...newImagePaths];
    }

    const updatedHeroData = await HeroSection.findOneAndUpdate(
      {},
      {
        $set: {
          banners: heroData.banners,
          images: heroData.images,
          settings: heroData.settings,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return new NextResponse(JSON.stringify(updatedHeroData), {
      status: 200,
      headers: noCacheHeaders,
    });
  } catch (error) {
    console.error("Error updating hero section:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Failed to update hero section",
        error: error.message,
      }),
      {
        status: 500,
        headers: noCacheHeaders,
      }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    const { imagePath } = await request.json();
    if (!imagePath) {
      return new NextResponse(JSON.stringify({ message: "Image path is required" }), {
        status: 400,
        headers: noCacheHeaders,
      });
    }

    await deleteFileFromDisk(imagePath);

    const updatedHeroData = await HeroSection.findOneAndUpdate(
      {},
      { $pull: { images: imagePath } },
      { new: true }
    );

    return new NextResponse(JSON.stringify(updatedHeroData), {
      status: 200,
      headers: noCacheHeaders,
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        message: "Failed to delete hero image",
        error: error.message,
      }),
      {
        status: 500,
        headers: noCacheHeaders,
      }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const updates = await request.json();

    const updatedHeroData = await HeroSection.findOneAndUpdate(
      {},
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return new NextResponse(JSON.stringify(updatedHeroData), {
      status: 200,
      headers: noCacheHeaders,
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        message: "Failed to update hero section",
        error: error.message,
      }),
      {
        status: 500,
        headers: noCacheHeaders,
      }
    );
  }
}
