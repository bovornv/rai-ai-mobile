import { Crop, SensorData, FarmField } from '../types';

// Crop growth calculations
export const calculateGrowthDays = (plantingDate: Date, currentDate: Date = new Date()): number => {
  const diffTime = currentDate.getTime() - plantingDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateDaysToHarvest = (plantingDate: Date, expectedHarvestDate: Date): number => {
  const diffTime = expectedHarvestDate.getTime() - plantingDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateGrowthPercentage = (crop: Crop): number => {
  const totalDays = calculateDaysToHarvest(crop.plantingDate, crop.expectedHarvestDate);
  const currentDays = calculateGrowthDays(crop.plantingDate);
  return Math.min(Math.max((currentDays / totalDays) * 100, 0), 100);
};

// Health score calculations
export const calculateCropHealthScore = (crop: Crop, sensors: SensorData[]): number => {
  const fieldSensors = sensors.filter(sensor => 
    sensor.location.lat === crop.plantingDate.getTime() // Simplified matching
  );

  if (fieldSensors.length === 0) return crop.healthScore;

  const sensorScores = fieldSensors.map(sensor => {
    switch (sensor.type) {
      case 'temperature':
        return sensor.value >= 20 && sensor.value <= 30 ? 100 : 
               sensor.value >= 15 && sensor.value <= 35 ? 75 : 50;
      case 'humidity':
        return sensor.value >= 40 && sensor.value <= 70 ? 100 : 
               sensor.value >= 30 && sensor.value <= 80 ? 75 : 50;
      case 'soil_moisture':
        return sensor.value >= 30 && sensor.value <= 60 ? 100 : 
               sensor.value >= 20 && sensor.value <= 70 ? 75 : 50;
      case 'ph':
        return sensor.value >= 6.0 && sensor.value <= 7.5 ? 100 : 
               sensor.value >= 5.5 && sensor.value <= 8.0 ? 75 : 50;
      default:
        return 75;
    }
  });

  const avgSensorScore = sensorScores.reduce((sum, score) => sum + score, 0) / sensorScores.length;
  return Math.round((crop.healthScore + avgSensorScore) / 2);
};

// Yield predictions
export const predictYield = (crop: Crop, fieldArea: number, historicalYield?: number): number => {
  const growthPercentage = calculateGrowthPercentage(crop);
  const healthFactor = crop.healthScore / 100;
  
  // Base yield per acre (kg) - varies by crop type
  const baseYieldPerAcre = {
    vegetable: 2000,
    fruit: 1500,
    grain: 3000,
    herb: 500,
  };

  const baseYield = baseYieldPerAcre[crop.type] * fieldArea;
  const growthFactor = growthPercentage / 100;
  
  // Apply health and growth factors
  let predictedYield = baseYield * healthFactor * growthFactor;
  
  // Adjust based on historical data if available
  if (historicalYield) {
    predictedYield = (predictedYield + historicalYield) / 2;
  }
  
  return Math.round(predictedYield);
};

// Water requirements
export const calculateWaterRequirement = (
  crop: Crop, 
  fieldArea: number, 
  temperature: number, 
  humidity: number
): number => {
  // Base water requirement per square meter per day (liters)
  const baseWaterPerSqm = {
    vegetable: 5,
    fruit: 6,
    grain: 4,
    herb: 3,
  };

  const baseWater = baseWaterPerSqm[crop.type] * fieldArea * 4047; // Convert acres to sqm
  
  // Temperature factor (higher temp = more water)
  const tempFactor = 1 + ((temperature - 20) * 0.02);
  
  // Humidity factor (lower humidity = more water)
  const humidityFactor = 1 + ((50 - humidity) * 0.01);
  
  return Math.round(baseWater * tempFactor * humidityFactor);
};

// Fertilizer calculations
export const calculateFertilizerRequirement = (
  fieldArea: number, 
  soilType: string, 
  cropType: string
): { nitrogen: number; phosphorus: number; potassium: number } => {
  // Base NPK requirements per acre (kg)
  const baseNPK = {
    vegetable: { nitrogen: 120, phosphorus: 60, potassium: 100 },
    fruit: { nitrogen: 100, phosphorus: 80, potassium: 120 },
    grain: { nitrogen: 150, phosphorus: 70, potassium: 90 },
    herb: { nitrogen: 80, phosphorus: 40, potassium: 60 },
  };

  const base = baseNPK[cropType as keyof typeof baseNPK] || baseNPK.vegetable;
  
  // Soil type adjustments
  const soilAdjustments = {
    clay: { nitrogen: 0.8, phosphorus: 1.2, potassium: 0.9 },
    sandy: { nitrogen: 1.2, phosphorus: 0.8, potassium: 1.1 },
    loamy: { nitrogen: 1.0, phosphorus: 1.0, potassium: 1.0 },
    silty: { nitrogen: 1.1, phosphorus: 1.1, potassium: 1.0 },
  };

  const adjustment = soilAdjustments[soilType as keyof typeof soilAdjustments] || soilAdjustments.loamy;
  
  return {
    nitrogen: Math.round(base.nitrogen * fieldArea * adjustment.nitrogen),
    phosphorus: Math.round(base.phosphorus * fieldArea * adjustment.phosphorus),
    potassium: Math.round(base.potassium * fieldArea * adjustment.potassium),
  };
};

// Disease risk assessment
export const calculateDiseaseRisk = (
  temperature: number,
  humidity: number,
  soilMoisture: number,
  cropType: string
): { risk: 'low' | 'medium' | 'high'; factors: string[] } => {
  const factors: string[] = [];
  let riskScore = 0;

  // Temperature factors
  if (temperature > 30) {
    riskScore += 2;
    factors.push('High temperature');
  } else if (temperature < 10) {
    riskScore += 1;
    factors.push('Low temperature');
  }

  // Humidity factors
  if (humidity > 80) {
    riskScore += 3;
    factors.push('High humidity');
  } else if (humidity < 30) {
    riskScore += 1;
    factors.push('Low humidity');
  }

  // Soil moisture factors
  if (soilMoisture > 70) {
    riskScore += 2;
    factors.push('Excessive soil moisture');
  } else if (soilMoisture < 20) {
    riskScore += 1;
    factors.push('Low soil moisture');
  }

  // Crop-specific factors
  if (cropType === 'vegetable' && humidity > 70) {
    riskScore += 1;
    factors.push('Vegetable-specific humidity risk');
  }

  let risk: 'low' | 'medium' | 'high';
  if (riskScore <= 2) {
    risk = 'low';
  } else if (riskScore <= 5) {
    risk = 'medium';
  } else {
    risk = 'high';
  }

  return { risk, factors };
};

// Economic calculations
export const calculateProfitability = (
  predictedYield: number,
  marketPrice: number,
  productionCosts: number
): { revenue: number; profit: number; profitMargin: number } => {
  const revenue = predictedYield * marketPrice;
  const profit = revenue - productionCosts;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    revenue: Math.round(revenue),
    profit: Math.round(profit),
    profitMargin: Math.round(profitMargin * 100) / 100,
  };
};

// Date utilities
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Unit conversions
export const convertTemperature = (celsius: number, toFahrenheit: boolean = false): number => {
  return toFahrenheit ? (celsius * 9/5) + 32 : celsius;
};

export const convertArea = (acres: number, toHectares: boolean = false): number => {
  return toHectares ? acres * 0.404686 : acres;
};

export const convertWeight = (kg: number, toPounds: boolean = false): number => {
  return toPounds ? kg * 2.20462 : kg;
};
