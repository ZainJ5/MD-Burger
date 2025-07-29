import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import NavbarInfo from "@/app/models/NavbarInfo";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Process logo image upload
 */
async function processLogoImage(formData) {
  const logoFile = formData.get('logo');
  let logoPath = null;
  
  if (logoFile && logoFile.size > 0) {
    // Create directory if needed
    const logoDir = path.join(process.cwd(), 'public');
    
    try {
      if (!existsSync(logoDir)) {
        await mkdir(logoDir, { recursive: true });
      }
    } catch (error) {
      throw new Error("Error creating directory: " + error.message);
    }

    // Process logo
    const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
    const logoFilePath = path.join(logoDir, 'logo.png');
    await writeFile(logoFilePath, logoBuffer);
    logoPath = '/logo.png';
  }

  return logoPath;
}

/**
 * Process social icon uploads
 */
async function processSocialIcons(formData) {
  const icons = formData.getAll('socialIcons');
  const iconIndexes = formData.getAll('socialIconIndexes');
  const iconPaths = [];
  const indexPaths = [];
  
  if (icons && icons.length > 0) {
    const iconsDir = path.join(process.cwd(), 'public', 'social-icons');
    
    try {
      if (!existsSync(iconsDir)) {
        await mkdir(iconsDir, { recursive: true });
      }
    } catch (error) {
      throw new Error("Error creating directory: " + error.message);
    }

    // Process icons
    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];
      if (icon.size > 0) {
        const fileExtension = icon.name.split('.').pop();
        const uniqueFilename = `icon-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const filePath = path.join(iconsDir, uniqueFilename);
        
        const iconBuffer = Buffer.from(await icon.arrayBuffer());
        await writeFile(filePath, iconBuffer);
        
        iconPaths.push(`/social-icons/${uniqueFilename}`);
        indexPaths.push(iconIndexes[i]);
      }
    }
  }

  return { iconPaths, indexPaths };
}

/**
 * Process menu PDF uploads
 */
async function processMenuFiles(formData) {
  const menuFiles = formData.getAll('menuFiles');
  const menuIndexes = formData.getAll('menuIndexes');
  const menuPaths = [];
  const indexPaths = [];
  
  if (menuFiles && menuFiles.length > 0) {
    const menuDir = path.join(process.cwd(), 'public', 'menu');
    
    try {
      if (!existsSync(menuDir)) {
        await mkdir(menuDir, { recursive: true });
      }
    } catch (error) {
      throw new Error("Error creating directory: " + error.message);
    }

    // Process menu files
    for (let i = 0; i < menuFiles.length; i++) {
      const menuFile = menuFiles[i];
      if (menuFile.size > 0) {
        const uniqueFilename = `menu-${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;
        const filePath = path.join(menuDir, uniqueFilename);
        
        const menuBuffer = Buffer.from(await menuFile.arrayBuffer());
        await writeFile(filePath, menuBuffer);
        
        menuPaths.push(`/menu/${uniqueFilename}`);
        indexPaths.push(menuIndexes[i]);
      }
    }
  }

  return { menuPaths, indexPaths };
}

/**
 * GET handler to retrieve navbar information
 */
export async function GET() {
  try {
    await connectDB();
    const navbarInfo = await NavbarInfo.findOne({});

    // Return default object if no data found
    if (!navbarInfo) {
      return NextResponse.json({
        restaurant: {
          name: "Tipu Burger & Broast",
          openingHours: "11:30 am to 3:30 am",
          logo: "/logo.png"
        },
        delivery: {
          time: "30-45 mins",
          minimumOrder: "Rs. 500 Only"
        },
        socialLinks: [
          { platform: "menu", icon: "/download.webp", isMenu: true, menuFile: "/tipu-menu-update-feb-25.pdf" },
          { platform: "whatsapp", icon: "/whatsapp-logo.webp", url: "https://wa.me/923332245706" },
          { platform: "phone", icon: "/phone.webp", url: "tel:+92111822111" },
          { platform: "facebook", icon: "/facebook.webp", url: "https://www.facebook.com/tipuburgerbroast" },
          { platform: "tiktok", icon: "/instagram.png", url: "https://www.tiktok.com/tipuburger" }
        ]
      }, { status: 200 });
    }

    return NextResponse.json(navbarInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch navbar information", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler to update navbar information
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const navbarDataString = formData.get('navbarData');
    
    if (!navbarDataString) {
      return NextResponse.json(
        { message: "Missing navbar data" },
        { status: 400 }
      );
    }
    
    // Parse the JSON data
    const navbarData = JSON.parse(navbarDataString);
    
    // Clean social links to ensure each has only the appropriate fields
    if (navbarData.socialLinks) {
      navbarData.socialLinks = navbarData.socialLinks.map(link => {
        const cleanedLink = { ...link };
        
        if (cleanedLink.isMenu) {
          // If it's a menu item, ensure it has no url field
          delete cleanedLink.url;
        } else {
          // If it's a social link, ensure it has no menuFile field
          delete cleanedLink.menuFile;
        }
        
        return cleanedLink;
      });
    }
    
    // Process logo if uploaded
    const logoPath = await processLogoImage(formData);
    if (logoPath) {
      navbarData.restaurant.logo = logoPath;
    }
    
    // Process social icons if uploaded
    const { iconPaths, indexPaths } = await processSocialIcons(formData);
    
    // Update social icons with the new paths
    if (iconPaths.length > 0 && indexPaths.length === iconPaths.length) {
      for (let i = 0; i < iconPaths.length; i++) {
        const index = parseInt(indexPaths[i]);
        if (index >= 0 && index < navbarData.socialLinks.length) {
          navbarData.socialLinks[index].icon = iconPaths[i];
        }
      }
    }
    
    // Process menu files if uploaded
    const { menuPaths, indexPaths: menuIndexPaths } = await processMenuFiles(formData);
    
    // Update menu files with the new paths
    if (menuPaths.length > 0 && menuIndexPaths.length === menuPaths.length) {
      for (let i = 0; i < menuPaths.length; i++) {
        const index = parseInt(menuIndexPaths[i]);
        if (index >= 0 && index < navbarData.socialLinks.length) {
          navbarData.socialLinks[index].menuFile = menuPaths[i];
          // Ensure isMenu flag is set and url is removed
          navbarData.socialLinks[index].isMenu = true;
          delete navbarData.socialLinks[index].url;
        }
      }
    }
    
    // Update or create the navbar information
    const updatedNavbar = await NavbarInfo.findOneAndUpdate(
      {}, 
      { 
        $set: {
          restaurant: navbarData.restaurant,
          delivery: navbarData.delivery,
          socialLinks: navbarData.socialLinks,
          updatedAt: new Date()
        } 
      },
      { 
        new: true,
        upsert: true 
      }
    );
    
    return NextResponse.json(updatedNavbar, { status: 200 });
  } catch (error) {
    console.error("Error updating navbar:", error);
    return NextResponse.json(
      { message: "Failed to update navbar information", error: error.message },
      { status: 500 }
    );
  }
}