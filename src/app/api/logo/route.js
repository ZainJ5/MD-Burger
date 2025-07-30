import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoose";
import Logo from "../../models/LogoSchema";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

async function processLogoUpload(file) {
  try {
    const logoDir = path.join(process.cwd(), 'public', 'logo');
    
    if (!existsSync(logoDir)) {
      await mkdir(logoDir, { recursive: true });
    }
    
    const fileExtension = file.name.split('.').pop();
    const filename = `logo-${Date.now()}.${fileExtension}`;
    const filePath = path.join(logoDir, filename);
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);
    
    return `/logo/${filename}`;
  } catch (error) {
    console.error("Error processing logo upload:", error);
    throw new Error("Failed to save logo: " + error.message);
  }
}

export async function GET() {
  try {
    await connectDB();
    const logoData = await Logo.findOne({});

    if (!logoData) {
      return NextResponse.json({
        logo: "/logo.png",
        updatedAt: new Date()
      }, { status: 200 });
    }

    return NextResponse.json(logoData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch logo information", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const logoFile = formData.get('logo');
    
    if (!logoFile) {
      return NextResponse.json(
        { message: "No logo file provided" },
        { status: 400 }
      );
    }
    
    const logoPath = await processLogoUpload(logoFile);
    
    const updatedLogo = await Logo.findOneAndUpdate(
      {}, 
      { 
        $set: {
          logo: logoPath,
          updatedAt: new Date()
        } 
      },
      { 
        new: true,
        upsert: true 
      }
    );
    
    return NextResponse.json(updatedLogo, { status: 200 });
  } catch (error) {
    console.error("Error updating logo:", error);
    return NextResponse.json(
      { message: "Failed to update logo", error: error.message },
      { status: 500 }
    );
  }
}