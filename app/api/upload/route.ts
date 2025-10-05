import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { createPrismaClient } from '@/lib/prisma';
import { notifyBulkUpload } from '../../../lib/notifications';

export async function POST(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers from first row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const headers = rawData[0] as string[];
    console.log('Detected headers:', headers);

    const data = XLSX.utils.sheet_to_json(worksheet);

    // Enhanced column detection with flexible matching
    const findColumn = (fieldName: string, keywords: string[], priority: number = 1) => {
      // Add validation for keywords parameter
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        console.log(`Invalid keywords for ${fieldName}:`, keywords);
        return -1;
      }

      const results: { index: number; score: number; header: string }[] = [];

      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]?.toString().toLowerCase().trim();
        if (!header) continue;

        let score = 0;

        // Exact match - highest priority
        if (keywords.some(keyword => header === keyword.toLowerCase())) {
          score = 100;
        }
        // Contains match
        else if (keywords.some(keyword => header.includes(keyword.toLowerCase()))) {
          score = 80;
        }
        // Partial word match
        else if (keywords.some(keyword => {
          const words = header.split(/[\s\-_]+/);
          return words.some(word => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()));
        })) {
          score = 60;
        }
        // Fuzzy similarity match (simple Levenshtein-like)
        else {
          for (const keyword of keywords) {
            const similarity = calculateSimilarity(header, keyword.toLowerCase());
            if (similarity > 0.6) { // 60% similarity threshold
              score = Math.max(score, similarity * 40);
            }
          }
        }

        if (score > 0) {
          results.push({ index: i, score: score + priority, header: headers[i] });
        }
      }

      // Return the best match
      if (results.length > 0) {
        results.sort((a, b) => b.score - a.score);
        console.log(`${fieldName} matched "${results[0].header}" with score ${results[0].score}`);
        return results[0].index;
      }

      return -1;
    };

    // Simple string similarity calculation
    const calculateSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;

      if (longer.length === 0) return 1.0;

      const distance = levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    };

    // Levenshtein distance calculation
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = [];

      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            );
          }
        }
      }

      return matrix[str2.length][str1.length];
    };

    // New column detections
    const attendeeIdCol = findColumn('Attendee ID', ['id', 'attendee id', '아이디', 'ID', 'attendee_id', 'attendeeID']);

    let nameCol = findColumn('Name', [
      'name', 'full name', 'fullname', 'first name', 'last name', 'attendee name',
      '이름', '성명', '이름', '성함', '이름', '성', '이름', '참석자명', '참석자',
      'full_name', 'attendee_name', 'person_name', '이름', '성함'
    ]);
    let emailCol = findColumn('Email', [
      'email', 'e-mail', 'mail', 'email address', '이메일', 'email', '메일', '이메일주소',
      'email_addr', 'mail_addr', '전자우편', '이메일', '메일주소', 'emailaddress'
    ]);
    const phoneCol = findColumn('Phone', [
      'phone', 'mobile', 'contact', 'tel', 'phone number', '번호', '전화', '휴대폰', '폰', '연락처',
      'mobile_phone', 'cell', 'cellphone', 'telephone', 'contact_number', 'phone_no'
    ]);
    const fullNameCol = findColumn('Full Name', ['full name', 'fullname', 'full_name', '이름', '성명']);
    const column2Col = findColumn('Column 2', ['열2', 'column2', 'col2']);
    const organizationCol = findColumn('Organization', ['organization', 'org', '기관', '조직']);
    const preferredTitleCol = findColumn('Preferred Title', ['preferred title', 'title', '선호직함', '직함']);
    const positionInOrgCol = findColumn('Position in Organization', ['position in organization', 'position', '직위', '직책']);
    const regionOfWorkCol = findColumn('Region of Work', ['region of work', 'region', '근무지역', '지역']);
    const phoneKoreanCol = findColumn('Phone Korean', ['번호', 'phone korean', 'korean phone']);
    const koreanTextCol = findColumn('Korean Text', ['한글', 'korean', '한국어']);
    const positionKoreanCol = findColumn('Position Korean', ['직분', 'position korean', 'korean position']);
    const englishTextCol = findColumn('English Text', ['영어', 'english', '영문']);
    const positionEnglishCol = findColumn('Position English', ['영어직분', 'position english', 'english position']);

    // Fallback: if no columns found, try positional detection
    let fallbackUsed = false;
    if (nameCol === -1 && headers.length > 0) {
      console.log('No name column found, trying first column as name');
      nameCol = 0; // First column
      fallbackUsed = true;
    }
    // Do not fallback for email - only set if actual email column found

    // Additional fallback: Use English name column if Full Name is not available
    if (englishTextCol !== -1 && nameCol === -1) {
      console.log('Using English name column as primary name source');
      nameCol = englishTextCol;
    }

    console.log('Column detection results:');
    console.log('Name column:', nameCol, nameCol !== -1 ? `"${headers[nameCol]}"` : 'NOT FOUND', fallbackUsed && nameCol === 0 ? '(FALLBACK)' : '');
    console.log('Email column:', emailCol, emailCol !== -1 ? `"${headers[emailCol]}"` : 'NOT FOUND', fallbackUsed && emailCol === 1 ? '(FALLBACK)' : '');
    console.log('Phone column:', phoneCol, phoneCol !== -1 ? `"${headers[phoneCol]}"` : 'NOT FOUND');
    console.log('Headers:', headers);
    console.log('All headers with indices:', headers.map((h, i) => `${i}: "${h}"`).join(', '));
    console.log('Data rows:', data.length);

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the Excel file' }, { status: 400 });
    }

    if (nameCol === -1 && emailCol === -1) {
      return NextResponse.json({
        error: 'Required columns not found. Please ensure your Excel file has at least one column for Name or Email.',
        detectedHeaders: headers,
        suggestion: 'Please check that your Excel file has headers containing words like: name, email, 이름, 이메일, etc.'
      }, { status: 400 });
    }

    if (fallbackUsed) {
      console.log('Using fallback column detection - this may not be accurate!');
    }

    // Debug: Log first few data rows to understand the structure
    console.log('First 3 data rows for debugging:');
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`Row ${i}:`, data[i]);
    }

    // Get all existing attendee names for duplicate checking
    const existingNames = new Set(
      (await prisma.attendee.findMany({ select: { name: true } })).map(a => a.name)
    );

    const attendees: any[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;

    // Process rows in batches to avoid memory issues
    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length);
      const batchPromises = [];

      for (let rowIndex = batchStart; rowIndex < batchEnd; rowIndex++) {
        batchPromises.push(processRow(rowIndex));
      }

      // Wait for batch to complete
      await Promise.all(batchPromises);
    }

    async function processRow(rowIndex: number) {
       const row = data[rowIndex];
       const rowData = row as Record<string, unknown>;

       // Improved data extraction with better error handling
       let name: string | undefined;
       let email: string | undefined;
       let phone: string | undefined;

       try {
         // Try primary name column first
         if (nameCol !== -1 && headers[nameCol]) {
           const nameValue = rowData[headers[nameCol]];
           name = nameValue?.toString().trim() || undefined;
         }

         // If no name found and English column is available, try that
         if (!name && englishTextCol !== -1 && headers[englishTextCol]) {
           const englishNameValue = rowData[headers[englishTextCol]];
           name = englishNameValue?.toString().trim() || undefined;
           if (name) {
             console.log(`Using English name as fallback: ${name}`);
           }
         }

         // Final fallback: try accessing by index if header-based access fails
         if (!name && nameCol >= 0 && nameCol < headers.length) {
           const rowArray = Object.values(rowData);
           if (rowArray[nameCol]) {
             name = rowArray[nameCol]?.toString().trim() || undefined;
           }
         }

         if (emailCol !== -1 && headers[emailCol]) {
           const emailValue = rowData[headers[emailCol]];
           email = emailValue?.toString().trim() || undefined;
         } else if (emailCol >= 0 && emailCol < headers.length) {
           const rowArray = Object.values(rowData);
           if (rowArray[emailCol]) {
             email = rowArray[emailCol]?.toString().trim() || undefined;
           }
         }

         if (phoneCol !== -1 && headers[phoneCol]) {
           const phoneValue = rowData[headers[phoneCol]];
           phone = phoneValue?.toString().trim() || undefined;
         } else if (phoneCol >= 0 && phoneCol < headers.length) {
           const rowArray = Object.values(rowData);
           if (rowArray[phoneCol]) {
             phone = rowArray[phoneCol]?.toString().trim() || undefined;
           }
         }

         // Treat empty email as undefined to avoid unique constraint issues
         if (email === '') email = undefined;

         console.log(`Processing row ${rowIndex + 1}:`, {
           name,
           email,
           phone,
           nameCol,
           emailCol,
           phoneCol,
           rowDataKeys: Object.keys(rowData),
           rowDataValues: Object.values(rowData).slice(0, 5) // Show first 5 values
         });

         // Skip rows with no identifiable data
         if (!name && !email) {
           console.log(`Skipping row ${rowIndex + 1} - no name or email`);
           console.log(`Available data in row:`, rowData);
           skippedCount++;
           return;
         }
       } catch (error) {
         console.error(`Error processing row ${rowIndex + 1}:`, error);
         console.log(`Row data:`, rowData);
         skippedCount++;
         return;
       }

      processedCount++;

      // Check if attendee already exists by name
      if (name && existingNames.has(name)) {
        console.log(`Skipping row ${rowIndex + 1} - duplicate name: ${name}`);
        duplicateCount++;
        return;
      }

      // Ensure we have a name (required field)
      const finalName = name || email || `Attendee ${rowIndex + 1}`;

      // Extract new column values
      const attendeeId = attendeeIdCol !== -1 ? rowData[headers[attendeeIdCol]]?.toString().trim() : undefined;
      const fullName = fullNameCol !== -1 ? rowData[headers[fullNameCol]]?.toString().trim() : undefined;
      const column2 = column2Col !== -1 ? rowData[headers[column2Col]]?.toString().trim() : undefined;
      const organization = organizationCol !== -1 ? rowData[headers[organizationCol]]?.toString().trim() : undefined;
      const preferredTitle = preferredTitleCol !== -1 ? rowData[headers[preferredTitleCol]]?.toString().trim() : undefined;
      const positionInOrganization = positionInOrgCol !== -1 ? rowData[headers[positionInOrgCol]]?.toString().trim() : undefined;
      const regionOfWork = regionOfWorkCol !== -1 ? rowData[headers[regionOfWorkCol]]?.toString().trim() : undefined;
      const phoneKorean = phoneKoreanCol !== -1 ? rowData[headers[phoneKoreanCol]]?.toString().trim() : undefined;
      const koreanText = koreanTextCol !== -1 ? rowData[headers[koreanTextCol]]?.toString().trim() : undefined;
      const positionKorean = positionKoreanCol !== -1 ? rowData[headers[positionKoreanCol]]?.toString().trim() : undefined;
      const englishText = englishTextCol !== -1 ? rowData[headers[englishTextCol]]?.toString().trim() : undefined;
      const positionEnglish = positionEnglishCol !== -1 ? rowData[headers[positionEnglishCol]]?.toString().trim() : undefined;

      // Collect all columns data (excluding the ones we already extracted)
      const extraData: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index !== nameCol && index !== emailCol && index !== phoneCol &&
            index !== attendeeIdCol && index !== fullNameCol && index !== column2Col &&
            index !== organizationCol && index !== preferredTitleCol && index !== positionInOrgCol &&
            index !== regionOfWorkCol && index !== phoneKoreanCol && index !== koreanTextCol &&
            index !== positionKoreanCol && index !== englishTextCol && index !== positionEnglishCol) {
          const value = rowData[header]?.toString().trim();
          if (value) {
            extraData[header] = value;
          }
        }
      });

      // Generate unique QR code data
      const timestamp = Date.now() + rowIndex; // Add rowIndex to ensure uniqueness
      const qrData = JSON.stringify({ name: finalName, email, phone, timestamp });

      try {
        const qrCode = await QRCode.toDataURL(qrData);

        attendees.push({
          name: finalName,
          email,
          phone,
          qrData,
          qrCode,
          nameCol: nameCol !== -1 ? headers[nameCol] : null,
          emailCol: emailCol !== -1 ? headers[emailCol] : null,
          phoneCol: phoneCol !== -1 ? headers[phoneCol] : null,
          attendeeId,
          fullName,
          column2,
          organization,
          preferredTitle,
          positionInOrganization,
          regionOfWork,
          phoneKorean,
          koreanText,
          positionKorean,
          englishText,
          positionEnglish,
          extraData: Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : null,
        });

        // Add to existing names to prevent duplicates within this batch
        existingNames.add(finalName);
      } catch (error) {
        console.error(`Failed to generate QR code for row ${rowIndex + 1}:`, error);
        skippedCount++;
      }
    }

    // Batch insert attendees
    let uploadedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const BATCH_INSERT_SIZE = 25;

    for (let i = 0; i < attendees.length; i += BATCH_INSERT_SIZE) {
      const batch = attendees.slice(i, i + BATCH_INSERT_SIZE);

      try {
        await prisma.$transaction(
          batch.map(attendee => prisma.attendee.create({ data: attendee }))
        );
        uploadedCount += batch.length;
      } catch (error) {
        // If batch fails, try individual inserts to identify which ones failed
        for (const attendee of batch) {
          try {
            await prisma.attendee.create({ data: attendee });
            uploadedCount++;
          } catch (individualError) {
            errorCount++;
            const errorMsg = `Failed to create attendee ${attendee.name}: ${(individualError as Error).message}`;
            console.log(errorMsg);
            errors.push(errorMsg);
          }
        }
      }
    }

    const summary = {
      message: `Upload completed. ${uploadedCount} attendees added, ${duplicateCount} duplicates skipped, ${skippedCount} rows skipped (no data), ${errorCount} errors.`,
      uploaded: uploadedCount,
      duplicates: duplicateCount,
      skipped: skippedCount,
      errors: errorCount,
      totalProcessed: processedCount,
      detectedHeaders: {
        allHeaders: headers,
        nameColumn: nameCol !== -1 ? { index: nameCol, header: headers[nameCol] } : null,
        emailColumn: emailCol !== -1 ? { index: emailCol, header: headers[emailCol] } : null,
        phoneColumn: phoneCol !== -1 ? { index: phoneCol, header: headers[phoneCol] } : null,
      },
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined // Show first 10 errors
    };

    // Create notification for upload completion
    await notifyBulkUpload(uploadedCount, errorCount);

    console.log('Upload summary:', summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: `Upload failed: ${(error as Error).message}` }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}