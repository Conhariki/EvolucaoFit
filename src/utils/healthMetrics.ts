export const calculateBMI = (weight: number, height: number): number => {
    if (!weight || !height) return 0;
    // Height in meters
    const bmi = weight / (height * height);
    return parseFloat(bmi.toFixed(1));
};

export const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 24.9) return 'Peso normal';
    if (bmi < 29.9) return 'Sobrepeso';
    if (bmi < 34.9) return 'Obesidade Grau 1';
    if (bmi < 39.9) return 'Obesidade Grau 2';
    return 'Obesidade Grau 3';
};

export const calculateBodyFat = (
    gender: string,
    waist: number,
    neck: number,
    hip: number,
    height: number
): number | null => {
    if (!gender || !waist || !neck || !height) return null;
    // Formula works with cm, height in cm. User height is often meters in DB, need to check.

    // US Navy Method
    // Men: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    // Women: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450

    // Ensure height is in cm
    const heightCm = height < 3 ? height * 100 : height;

    const log10 = Math.log10;
    let bodyFat = 0;

    if (gender.toUpperCase() === 'MASCULINO') {
        if (waist - neck <= 0) return null; // Invalid measurement
        bodyFat = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(heightCm)) - 450;
    } else {
        if (!hip) return null;
        if (waist + hip - neck <= 0) return null; // Invalid measurement
        bodyFat = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(heightCm)) - 450;
    }



    // Sanity check for Navy method
    if (bodyFat < 0) return 0;
    if (bodyFat > 70) return 70; // Cap at reasonable max or return null

    return parseFloat(bodyFat.toFixed(1));
};

export const calculateBodyFat7Site = (
    gender: string,
    measurements: {
        chest: number;
        axilla: number;
        tricep: number;
        subscapular: number;
        abdomen: number;
        suprailiac: number;
        thigh: number;
    },
    age: number
): number | null => {
    const { chest, axilla, tricep, subscapular, abdomen, suprailiac, thigh } = measurements;

    if (!chest || !axilla || !tricep || !subscapular || !abdomen || !suprailiac || !thigh || !age) {
        return null;
    }

    const sum = chest + axilla + tricep + subscapular + abdomen + suprailiac + thigh;
    let bodyDensity = 0;

    if (gender.toUpperCase() === 'MASCULINO') {
        // Jackson-Pollock 7-Site Male
        bodyDensity = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
    } else {
        // Jackson-Pollock 7-Site Female
        bodyDensity = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
    }

    // Siri Equation
    const bodyFat = (495 / bodyDensity) - 450;

    // Sanity check
    if (bodyFat < 0 || bodyFat > 70) return null;

    return parseFloat(bodyFat.toFixed(1));
};
