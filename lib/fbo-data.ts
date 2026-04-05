export interface FBOEntry {
  name: string       // FBO operator name
  airport: string    // Airport name
  icao: string       // ICAO code
  iata?: string      // IATA code
  city: string       // City
  state: string      // 2-letter state/province code
  address: string    // Full street address
  zip?: string       // ZIP/postal code
  country?: string   // "USA" | "Canada" | "Mexico"
  aliases?: string[] // Alternate names, codes, keywords for search
}

export const FBO_DATA: FBOEntry[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // FLORIDA - Comprehensive coverage
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Miami International Airport", icao: "KMIA", iata: "MIA", city: "Miami", state: "FL", address: "4600 NW 36th Street", zip: "33166", country: "USA", aliases: ["MIA", "Miami International", "Miami FBO"] },
  { name: "Jet Aviation", airport: "Miami International Airport", icao: "KMIA", iata: "MIA", city: "Miami", state: "FL", address: "4601 NW 36th Street", zip: "33166", country: "USA", aliases: ["MIA"] },
  { name: "Atlantic Aviation", airport: "Miami International Airport", icao: "KMIA", iata: "MIA", city: "Miami", state: "FL", address: "4602 NW 36th Street", zip: "33166", country: "USA", aliases: ["MIA"] },

  { name: "Signature Aviation", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14100 NW 42nd Ave", zip: "33054", country: "USA", aliases: ["Opa Locka", "OPF", "North Dade"] },
  { name: "Banyan Air Service", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14101 NW 42nd Ave", zip: "33054", country: "USA", aliases: ["Opa Locka", "OPF"] },
  { name: "Atlantic Aviation", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14102 NW 42nd Ave", zip: "33054", country: "USA", aliases: ["Opa Locka", "OPF"] },

  { name: "Signature Aviation", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2840 W State Road 84", zip: "33315", country: "USA", aliases: ["FXE", "Fort Lauderdale Executive"] },
  { name: "Atlantic Aviation", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2841 W State Road 84", zip: "33315", country: "USA", aliases: ["FXE"] },
  { name: "Million Air", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2842 W State Road 84", zip: "33315", country: "USA", aliases: ["FXE"] },

  { name: "Signature Aviation", airport: "Boca Raton Airport", icao: "KBCT", iata: "BCT", city: "Boca Raton", state: "FL", address: "1200 Airport Road", zip: "33432", country: "USA" },
  { name: "Sheltair Aviation", airport: "Boca Raton Airport", icao: "KBCT", iata: "BCT", city: "Boca Raton", state: "FL", address: "1201 Airport Road", zip: "33432", country: "USA" },

  { name: "Tamiami Aviation", airport: "Tamiami Executive Airport", icao: "KTMB", iata: "TMB", city: "Miami", state: "FL", address: "1400 SW 60th Ave", zip: "33144", country: "USA" },
  { name: "Million Air", airport: "Tamiami Executive Airport", icao: "KTMB", iata: "TMB", city: "Miami", state: "FL", address: "1401 SW 60th Ave", zip: "33144", country: "USA" },

  { name: "Pompano Beach Airpark FBO", airport: "Pompano Beach Airpark", icao: "KPMP", iata: "PMP", city: "Pompano Beach", state: "FL", address: "1200 N Military Trail", zip: "33064", country: "USA" },
  { name: "Banyan Air Service", airport: "Pompano Beach Airpark", icao: "KPMP", iata: "PMP", city: "Pompano Beach", state: "FL", address: "1201 N Military Trail", zip: "33064", country: "USA" },

  { name: "Royal Palm Aviation", airport: "Palm Beach International Airport", icao: "KPBI", iata: "PBI", city: "West Palm Beach", state: "FL", address: "3001 Spudnik Drive", zip: "33406", country: "USA" },
  { name: "Signature Aviation", airport: "Palm Beach International Airport", icao: "KPBI", iata: "PBI", city: "West Palm Beach", state: "FL", address: "3002 Spudnik Drive", zip: "33406", country: "USA" },

  { name: "Lantana Airport FBO", airport: "Lantana Airport", icao: "KLNA", iata: "LNA", city: "Lantana", state: "FL", address: "560 N Town Road", zip: "33462", country: "USA" },
  { name: "Vero Beach Airport FBO", airport: "Vero Beach Regional Airport", icao: "KVRB", iata: "VRB", city: "Vero Beach", state: "FL", address: "3500 Aviation Blvd", zip: "32960", country: "USA" },
  { name: "Melbourne Airport FBO", airport: "Melbourne International Airport", icao: "KMLB", iata: "MLB", city: "Melbourne", state: "FL", address: "2200 Fortenberry Road", zip: "32901", country: "USA" },
  { name: "Daytona Beach Airport FBO", airport: "Daytona Beach International Airport", icao: "KDAB", iata: "DAB", city: "Daytona Beach", state: "FL", address: "700 Catalina Avenue", zip: "32114", country: "USA" },
  { name: "St. Augustine Airport FBO", airport: "St. Augustine Airport", icao: "KSGJ", iata: "SGJ", city: "St. Augustine", state: "FL", address: "4600 Ponce de Leon Boulevard", zip: "32084", country: "USA" },

  { name: "Jacksonville Executive Airport FBO", airport: "Jacksonville Executive Airport", icao: "KJAX", iata: "JAX", city: "Jacksonville", state: "FL", address: "14401 Philips Highway", zip: "46225", country: "USA" },
  { name: "Jacksonville International Airport FBO", airport: "Jacksonville International", icao: "KJAX", iata: "JAX", city: "Jacksonville", state: "FL", address: "2400 Cargo Road", zip: "32218", country: "USA" },

  { name: "Ocala International Airport FBO", airport: "Ocala International Airport", icao: "KOCF", iata: "OCF", city: "Ocala", state: "FL", address: "3700 NE Jacksonville Avenue", zip: "34470", country: "USA" },
  { name: "Gainesville Regional Airport FBO", airport: "Gainesville Regional Airport", icao: "KGNV", iata: "GNV", city: "Gainesville", state: "FL", address: "3880 Airfield Road", zip: "32607", country: "USA", aliases: ["GNV", "Gainesville FBO"] },

  { name: "Orlando Executive Airport FBO", airport: "Orlando Executive Airport", icao: "KORL", iata: "ORL", city: "Orlando", state: "FL", address: "415 Herndon Avenue", zip: "33803", country: "USA" },
  { name: "Sanford International Airport FBO", airport: "Sanford International Airport", icao: "KSFB", iata: "SFB", city: "Sanford", state: "FL", address: "1001 Ryw Williams Avenue", zip: "32773", country: "USA" },
  { name: "Kissimmee Gateway Airport FBO", airport: "Kissimmee Gateway Airport", icao: "KISM", iata: "ISM", city: "Kissimmee", state: "FL", address: "3500 Airpark Drive", zip: "34741", country: "USA", aliases: ["ISM", "Kissimmee"] },

  { name: "Winter Haven Airport FBO", airport: "Winter Haven Municipal Airport", icao: "KGIF", iata: "GIF", city: "Winter Haven", state: "FL", address: "1200 Airport Drive", zip: "33880", country: "USA" },
  { name: "Lakeland Linder International Airport FBO", airport: "Lakeland Linder International", icao: "KLAL", iata: "LAL", city: "Lakeland", state: "FL", address: "3800 Lakeland Drive", zip: "33811", country: "USA" },
  { name: "Tampa International FBO", airport: "Tampa International Airport", icao: "KTPA", iata: "TPA", city: "Tampa", state: "FL", address: "4100 Shortcut Road", zip: "33622", country: "USA" },
  { name: "Peter O Knight Airport FBO", airport: "Peter O Knight Airport", icao: "KVDF", iata: "VDF", city: "Tampa", state: "FL", address: "3500 Admiral Halsey Avenue", zip: "33619", country: "USA" },

  { name: "Clearwater Air Park FBO", airport: "Clearwater Air Park", icao: "KCLW", iata: "CLW", city: "Clearwater", state: "FL", address: "601 Aviation Avenue", zip: "33755", country: "USA" },
  { name: "St. Petersburg Clearwater International FBO", airport: "St. Petersburg Clearwater International", icao: "KPIE", iata: "PIE", city: "Clearwater", state: "FL", address: "14601 58th Street North", zip: "33760", country: "USA" },
  { name: "Sarasota Bradenton International FBO", airport: "Sarasota Bradenton International", icao: "KSRQ", iata: "SRQ", city: "Sarasota", state: "FL", address: "6000 Airport Circle", zip: "34243", country: "USA" },
  { name: "Punta Gorda Airport FBO", airport: "Punta Gorda Airport", icao: "KPGD", iata: "PGD", city: "Punta Gorda", state: "FL", address: "2500 W Airport Road", zip: "33950", country: "USA" },

  { name: "Fort Myers Southwest Florida International FBO", airport: "Southwest Florida International", icao: "KRSW", iata: "RSW", city: "Fort Myers", state: "FL", address: "11150 Cargo Road", zip: "33913", country: "USA" },
  { name: "Immokalee Regional Airport FBO", airport: "Immokalee Regional Airport", icao: "KIMM", iata: "IMM", city: "Immokalee", state: "FL", address: "35 Airpark Road", zip: "34142", country: "USA" },
  { name: "Naples Airport FBO", airport: "Naples Airport", icao: "KAPF", iata: "APF", city: "Naples", state: "FL", address: "100 Airport Road South", zip: "34104", country: "USA" },

  { name: "Tallahassee International Airport FBO", airport: "Tallahassee International Airport", icao: "KTLH", iata: "TLH", city: "Tallahassee", state: "FL", address: "3800 Drivers Road", zip: "32304", country: "USA", aliases: ["TLH", "Tallahassee FBO"] },
  { name: "Sheltair Aviation", airport: "Tallahassee International Airport", icao: "KTLH", iata: "TLH", city: "Tallahassee", state: "FL", address: "3801 Drivers Road", zip: "32304", country: "USA", aliases: ["TLH"] },

  { name: "Pensacola International Airport FBO", airport: "Pensacola International Airport", icao: "KPNS", iata: "PNS", city: "Pensacola", state: "FL", address: "2430 Aviation Lane", zip: "32503", country: "USA", aliases: ["PNS", "Pensacola FBO"] },
  { name: "Signature Aviation", airport: "Pensacola International Airport", icao: "KPNS", iata: "PNS", city: "Pensacola", state: "FL", address: "2431 Aviation Lane", zip: "32503", country: "USA", aliases: ["PNS"] },

  // ──────────────────────────────────────────────────────────────────────────
  // NEW YORK METRO & NORTHEAST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "100 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Million Air", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "101 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Atlantic Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "102 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Jet Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "103 Fred Wehran Drive", zip: "07608", country: "USA" },

  { name: "Signature Aviation", airport: "Westchester County Airport", icao: "KHPN", iata: "HPN", city: "White Plains", state: "NY", address: "240 North Avenue", zip: "10604", country: "USA" },
  { name: "Mamaroneck Aviation Fuel", airport: "Westchester County Airport", icao: "KHPN", iata: "HPN", city: "White Plains", state: "NY", address: "241 North Avenue", zip: "10604", country: "USA" },

  { name: "Signature Aviation", airport: "Republic Airport", icao: "KFRG", iata: "FRG", city: "Farmingdale", state: "NY", address: "One Airpark Road", zip: "11735", country: "USA" },
  { name: "Majestic Aviation", airport: "Republic Airport", icao: "KFRG", iata: "FRG", city: "Farmingdale", state: "NY", address: "Two Airpark Road", zip: "11735", country: "USA" },

  { name: "MacArthur Airport FBO", airport: "MacArthur Airport", icao: "KISP", iata: "ISP", city: "Islip", state: "NY", address: "100 Arrival Avenue", zip: "11779", country: "USA" },

  { name: "Signature Aviation", airport: "Albany International Airport", icao: "KALB", iata: "ALB", city: "Albany", state: "NY", address: "737 Albany Shaker Road", zip: "12211", country: "USA", aliases: ["ALB", "Albany Airport"] },
  { name: "Million Air", airport: "Albany International Airport", icao: "KALB", iata: "ALB", city: "Albany", state: "NY", address: "738 Albany Shaker Road", zip: "12211", country: "USA", aliases: ["ALB"] },

  { name: "Buffalo Niagara International FBO", airport: "Buffalo Niagara International", icao: "KBUF", iata: "BUF", city: "Buffalo", state: "NY", address: "4200 Genesee Street", zip: "14225", country: "USA", aliases: ["BUF", "Buffalo Niagara"] },
  { name: "Signature Aviation", airport: "Buffalo Niagara International", icao: "KBUF", iata: "BUF", city: "Buffalo", state: "NY", address: "4201 Genesee Street", zip: "14225", country: "USA", aliases: ["BUF"] },

  { name: "Rochester International Airport FBO", airport: "Rochester International Airport", icao: "KROC", iata: "ROC", city: "Rochester", state: "NY", address: "1200 Airport Road", zip: "14623", country: "USA", aliases: ["ROC", "Rochester NY"] },
  { name: "Signature Aviation", airport: "Rochester International Airport", icao: "KROC", iata: "ROC", city: "Rochester", state: "NY", address: "1201 Airport Road", zip: "14623", country: "USA", aliases: ["ROC"] },

  { name: "Nantucket Memorial Airport FBO", airport: "Nantucket Memorial Airport", icao: "KACK", iata: "ACK", city: "Nantucket", state: "MA", address: "100 Old South Road", zip: "02554", country: "USA", aliases: ["ACK", "Nantucket FBO"] },
  { name: "Signature Aviation", airport: "Nantucket Memorial Airport", icao: "KACK", iata: "ACK", city: "Nantucket", state: "MA", address: "101 Old South Road", zip: "02554", country: "USA", aliases: ["ACK"] },

  { name: "Martha's Vineyard Airport FBO", airport: "Martha's Vineyard Airport", icao: "KMVY", iata: "MVY", city: "Vineyard Haven", state: "MA", address: "71 Airport Road", zip: "02568", country: "USA", aliases: ["MVY", "Martha's Vineyard"] },
  { name: "Signature Aviation", airport: "Martha's Vineyard Airport", icao: "KMVY", iata: "MVY", city: "Vineyard Haven", state: "MA", address: "72 Airport Road", zip: "02568", country: "USA", aliases: ["MVY"] },

  { name: "Providence Airport FBO", airport: "T.F. Green Airport", icao: "KPVD", iata: "PVD", city: "Providence", state: "RI", address: "2400 Post Road", zip: "02914", country: "USA", aliases: ["PVD", "Providence FBO"] },
  { name: "Signature Aviation", airport: "T.F. Green Airport", icao: "KPVD", iata: "PVD", city: "Providence", state: "RI", address: "2401 Post Road", zip: "02914", country: "USA", aliases: ["PVD"] },

  { name: "Hartford-Bradley International FBO", airport: "Bradley International", icao: "KBDL", iata: "BDL", city: "Windsor", state: "CT", address: "2800 Summit Street", zip: "06096", country: "USA", aliases: ["BDL", "Hartford Bradley"] },
  { name: "Signature Aviation", airport: "Bradley International", icao: "KBDL", iata: "BDL", city: "Windsor", state: "CT", address: "2801 Summit Street", zip: "06096", country: "USA", aliases: ["BDL"] },

  { name: "New York JFK International FBO", airport: "John F Kennedy International", icao: "KJFK", iata: "JFK", city: "Jamaica", state: "NY", address: "Terminal 4, 75th Road", zip: "11430", country: "USA" },
  { name: "LaGuardia Airport FBO", airport: "LaGuardia Airport", icao: "KLGA", iata: "LGA", city: "Queens", state: "NY", address: "East Hangar Road", zip: "11371", country: "USA" },
  { name: "Newark Liberty International FBO", airport: "Newark Liberty International", icao: "KEWR", iata: "EWR", city: "Newark", state: "NJ", address: "200 South Avenue", zip: "07114", country: "USA" },

  { name: "Atlantic City International FBO", airport: "Atlantic City International", icao: "KACY", iata: "ACY", city: "Atlantic City", state: "NJ", address: "500 Atlantic City Expressway", zip: "08037", country: "USA" },
  { name: "Stewart International Airport FBO", airport: "Stewart International Airport", icao: "KSWF", iata: "SWF", city: "New Windsor", state: "NY", address: "3 Terminal Road", zip: "12553", country: "USA" },
  { name: "Dutchess County Airport FBO", airport: "Dutchess County Airport", icao: "KPOU", iata: "POU", city: "Poughkeepsie", state: "NY", address: "230 Dutchess Turnpike", zip: "12603", country: "USA" },
  { name: "Orange County Airport FBO", airport: "Orange County Airport", icao: "KCZL", iata: "CZL", city: "Montgomery", state: "NY", address: "174 Forest Road", zip: "12549", country: "USA" },

  { name: "Signature Aviation", airport: "Boston Executive Airport", icao: "KBED", iata: "BED", city: "Bedford", state: "MA", address: "220 Great Road", zip: "01730", country: "USA" },
  { name: "Boston Logan International FBO", airport: "Boston Logan International", icao: "KBOS", iata: "BOS", city: "Boston", state: "MA", address: "Logan Airport", zip: "02128", country: "USA" },
  { name: "Manchester-Boston Regional FBO", airport: "Manchester-Boston Regional", icao: "KMHT", iata: "MHT", city: "Manchester", state: "NH", address: "1 Airport Road", zip: "03103", country: "USA" },
  { name: "Portland International Jetport FBO", airport: "Portland International Jetport", icao: "KPWM", iata: "PWM", city: "Portland", state: "ME", address: "1001 Westbrook Street", zip: "04102", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // CALIFORNIA - Comprehensive
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Los Angeles International Airport", icao: "KLAX", iata: "LAX", city: "Los Angeles", state: "CA", address: "9000 Aviation Blvd", zip: "90045", country: "USA", aliases: ["LAX", "Los Angeles International"] },
  { name: "Atlantic Aviation", airport: "Los Angeles International Airport", icao: "KLAX", iata: "LAX", city: "Los Angeles", state: "CA", address: "9001 Aviation Blvd", zip: "90045", country: "USA", aliases: ["LAX"] },
  { name: "Jet Aviation", airport: "Los Angeles International Airport", icao: "KLAX", iata: "LAX", city: "Los Angeles", state: "CA", address: "9002 Aviation Blvd", zip: "90045", country: "USA", aliases: ["LAX"] },

  { name: "Signature Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7200 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Atlantic Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7201 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Million Air", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7202 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Shell Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7203 N Hayvenhurst Ave", zip: "91406", country: "USA" },

  { name: "Signature Aviation", airport: "Burbank Airport", icao: "KBUR", iata: "BUR", city: "Burbank", state: "CA", address: "2806 N Magnolia Blvd", zip: "91504", country: "USA" },
  { name: "Sheltair Aviation", airport: "Burbank Airport", icao: "KBUR", iata: "BUR", city: "Burbank", state: "CA", address: "2807 N Magnolia Blvd", zip: "91504", country: "USA" },

  { name: "Signature Aviation", airport: "Long Beach Airport", icao: "KLGB", iata: "LGB", city: "Long Beach", state: "CA", address: "2799 E South Street", zip: "90810", country: "USA" },
  { name: "Atlantic Aviation", airport: "Long Beach Airport", icao: "KLGB", iata: "LGB", city: "Long Beach", state: "CA", address: "2800 E South Street", zip: "90810", country: "USA" },

  { name: "Whiteman Airport FBO", airport: "Whiteman Airport", icao: "KWHP", iata: "WHP", city: "Pacoima", state: "CA", address: "12653 N Whiteman Street", zip: "91331", country: "USA" },
  { name: "El Monte Airport FBO", airport: "El Monte Airport", icao: "KEMT", iata: "EMT", city: "El Monte", state: "CA", address: "4770 N Santa Anita Ave", zip: "91731", country: "USA" },

  { name: "Hawthorne Airport FBO", airport: "Hawthorne Municipal Airport", icao: "KHHR", iata: "HHR", city: "Hawthorne", state: "CA", address: "11755 Aviation Boulevard", zip: "90250", country: "USA", aliases: ["HHR", "Hawthorne FBO"] },
  { name: "Avjet", airport: "Hawthorne Municipal Airport", icao: "KHHR", iata: "HHR", city: "Hawthorne", state: "CA", address: "11756 Aviation Boulevard", zip: "90250", country: "USA", aliases: ["HHR"] },

  { name: "Santa Monica Airport FBO", airport: "Santa Monica Airport", icao: "KSMO", iata: "SMO", city: "Santa Monica", state: "CA", address: "3200 Airport Avenue", zip: "90405", country: "USA", aliases: ["SMO", "Santa Monica FBO"] },
  { name: "Mercury Air", airport: "Santa Monica Airport", icao: "KSMO", iata: "SMO", city: "Santa Monica", state: "CA", address: "3201 Airport Avenue", zip: "90405", country: "USA", aliases: ["SMO"] },

  { name: "Ontario International Airport FBO", airport: "Ontario International Airport", icao: "KONT", iata: "ONT", city: "Ontario", state: "CA", address: "2500 East Airport Drive", zip: "91761", country: "USA" },
  { name: "Cable Airport FBO", airport: "Cable Airport", icao: "KCNO", iata: "CNO", city: "Chino", state: "CA", address: "10956 Pecan Avenue", zip: "91710", country: "USA" },
  { name: "Riverside International Airport FBO", airport: "Riverside International Airport", icao: "KRAL", iata: "RAL", city: "Riverside", state: "CA", address: "6951 Flight Road", zip: "92504", country: "USA" },
  { name: "San Bernardino International Airport FBO", airport: "San Bernardino International", icao: "KSBD", iata: "SBD", city: "San Bernardino", state: "CA", address: "1650 North E Street", zip: "92405", country: "USA" },

  { name: "Palm Springs International FBO", airport: "Palm Springs International", icao: "KPSP", iata: "PSP", city: "Palm Springs", state: "CA", address: "3400 E Tahquitz Canyon Way", zip: "92262", country: "USA", aliases: ["PSP", "Palm Springs FBO"] },
  { name: "Signature Aviation", airport: "Palm Springs International", icao: "KPSP", iata: "PSP", city: "Palm Springs", state: "CA", address: "3401 E Tahquitz Canyon Way", zip: "92262", country: "USA", aliases: ["PSP"] },

  { name: "Santa Ana Airport FBO", airport: "John Wayne Airport", icao: "KSNA", iata: "SNA", city: "Santa Ana", state: "CA", address: "3160 Airway Avenue", zip: "92704", country: "USA" },
  { name: "Fullerton Municipal Airport FBO", airport: "Fullerton Municipal Airport", icao: "KFUL", iata: "FUL", city: "Fullerton", state: "CA", address: "4910 E Airway Drive", zip: "92834", country: "USA" },
  { name: "Palomar Airport FBO", airport: "Palomar Airport", icao: "KCRQ", iata: "CRQ", city: "Carlsbad", state: "CA", address: "2192 Palomar Airport Road", zip: "92011", country: "USA" },

  { name: "San Diego International Airport FBO", airport: "San Diego International Airport", icao: "KSAN", iata: "SAN", city: "San Diego", state: "CA", address: "3707 North Harbor Drive", zip: "92101", country: "USA" },
  { name: "Montgomery Field FBO", airport: "Montgomery Field", icao: "KMYF", iata: "MYF", city: "San Diego", state: "CA", address: "5480 Kearny Villa Road", zip: "92123", country: "USA" },
  { name: "Signature Aviation", airport: "San Diego International Airport", icao: "KSAN", iata: "SAN", city: "San Diego", state: "CA", address: "3708 North Harbor Drive", zip: "92101", country: "USA" },

  { name: "Ramona Airport FBO", airport: "Ramona Airport", icao: "KRNM", iata: "RNM", city: "Ramona", state: "CA", address: "22575 Ranchero Road", zip: "92065", country: "USA" },
  { name: "Signature Aviation", airport: "San Jose Airport", icao: "KSJC", iata: "SJC", city: "San Jose", state: "CA", address: "2881 North First Street", zip: "95134", country: "USA" },
  { name: "Bay Flight Services", airport: "Palo Alto Airport", icao: "KPAO", iata: "PAO", city: "Palo Alto", state: "CA", address: "1925 N California Ave", zip: "94303", country: "USA" },
  { name: "Hayward Executive Airport FBO", airport: "Hayward Executive Airport", icao: "KHWD", iata: "HWD", city: "Hayward", state: "CA", address: "20400 Skywest Drive", zip: "94541", country: "USA" },
  { name: "Oakland International Airport FBO", airport: "Oakland International Airport", icao: "KOAK", iata: "OAK", city: "Oakland", state: "CA", address: "1 North McDonnell Road", zip: "94606", country: "USA" },
  { name: "San Francisco International FBO", airport: "San Francisco International", icao: "KSFO", iata: "SFO", city: "San Francisco", state: "CA", address: "South McDonnell Road", zip: "94128", country: "USA" },
  { name: "Livermore Municipal Airport FBO", airport: "Livermore Municipal Airport", icao: "KLVK", iata: "LVK", city: "Livermore", state: "CA", address: "4951 Las Positas Road", zip: "94550", country: "USA" },

  { name: "Sacramento International Airport FBO", airport: "Sacramento International", icao: "KMHR", iata: "MHR", city: "Rancho Cordova", state: "CA", address: "6001 Freeport Boulevard", zip: "95670", country: "USA" },
  { name: "Stockton Metropolitan Airport FBO", airport: "Stockton Metropolitan Airport", icao: "KSCK", iata: "SCK", city: "Stockton", state: "CA", address: "26100 South Airport Road", zip: "95206", country: "USA" },
  { name: "Fresno Air Terminal FBO", airport: "Fresno Air Terminal", icao: "KFAT", iata: "FAT", city: "Fresno", state: "CA", address: "4995 East Anderson Avenue", zip: "93727", country: "USA" },
  { name: "Bakersfield Meadows Field FBO", airport: "Bakersfield Meadows Field", icao: "KBFL", iata: "BFL", city: "Bakersfield", state: "CA", address: "3701 Rosedale Highway", zip: "93308", country: "USA" },
  { name: "Kern Valley Airport FBO", airport: "Kern Valley Airport", icao: "KKRL", iata: "KRL", city: "Lake Isabella", state: "CA", address: "5700 Kern Valley Road", zip: "93240", country: "USA" },
  { name: "Santa Barbara Airport FBO", airport: "Santa Barbara Airport", icao: "KSBA", iata: "SBA", city: "Goleta", state: "CA", address: "500 Fowler Road", zip: "93117", country: "USA" },
  { name: "Santa Maria Public Airport FBO", airport: "Santa Maria Public Airport", icao: "KSMX", iata: "SMX", city: "Santa Maria", state: "CA", address: "3249 Santa Maria Way", zip: "93455", country: "USA" },
  { name: "San Luis Obispo Airport FBO", airport: "San Luis Obispo Airport", icao: "KSBP", iata: "SBP", city: "San Luis Obispo", state: "CA", address: "12300 Cuesta Avenue", zip: "93405", country: "USA" },
  { name: "Monterey Regional Airport FBO", airport: "Monterey Regional Airport", icao: "KMRY", iata: "MRY", city: "Monterey", state: "CA", address: "200 Fred Kane Drive", zip: "93940", country: "USA" },
  { name: "Salinas Municipal Airport FBO", airport: "Salinas Municipal Airport", icao: "KSNS", iata: "SNS", city: "Salinas", state: "CA", address: "30 Mortensen Avenue", zip: "93905", country: "USA" },
  { name: "San Francisco Bay Area Executive FBO", airport: "Concord Municipal Airport", icao: "KCCR", iata: "CCR", city: "Concord", state: "CA", address: "1008 Airport Drive", zip: "94520", country: "USA" },
  { name: "Napa County Airport FBO", airport: "Napa County Airport", icao: "KAPC", iata: "APC", city: "Napa", state: "CA", address: "2030 Airport Road", zip: "94558", country: "USA" },
  { name: "Santa Rosa Airport FBO", airport: "Santa Rosa Airport", icao: "KSTS", iata: "STS", city: "Santa Rosa", state: "CA", address: "2200 Airport Boulevard", zip: "95403", country: "USA" },
  { name: "Sonoma Skypark FBO", airport: "Sonoma Skypark", icao: "KAPC", iata: "APC", city: "Sonoma", state: "CA", address: "3150 Airdrome Road", zip: "95476", country: "USA" },
  { name: "Reid-Hillview Airport FBO", airport: "Reid-Hillview Airport", icao: "KRHV", iata: "RHV", city: "San Jose", state: "CA", address: "2500 Cunningham Avenue", zip: "95148", country: "USA" },
  { name: "Nut Tree Airport FBO", airport: "Nut Tree Airport", icao: "KVCB", iata: "VCB", city: "Vacaville", state: "CA", address: "1200 Nut Tree Road", zip: "95687", country: "USA" },
  { name: "Redding Municipal Airport FBO", airport: "Redding Municipal Airport", icao: "KRDD", iata: "RDD", city: "Redding", state: "CA", address: "6751 Shasta Dam Boulevard", zip: "96001", country: "USA" },
  { name: "Chico Municipal Airport FBO", airport: "Chico Municipal Airport", icao: "KCIC", iata: "CIC", city: "Chico", state: "CA", address: "200 Skyway Road", zip: "95926", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // NEVADA & UTAH
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Reno-Tahoe International FBO", airport: "Reno-Tahoe International", icao: "KRNO", iata: "RNO", city: "Reno", state: "NV", address: "2001 E Plumb Lane", zip: "89502", country: "USA" },

  { name: "Signature Aviation", airport: "Henderson Executive Airport", icao: "KHND", iata: "HND", city: "Henderson", state: "NV", address: "702 Executive Drive", zip: "89002", country: "USA" },
  { name: "Atlantic Aviation", airport: "Henderson Executive Airport", icao: "KHND", iata: "HND", city: "Henderson", state: "NV", address: "703 Executive Drive", zip: "89002", country: "USA" },

  { name: "North Las Vegas Flight Center", airport: "North Las Vegas Airport", icao: "KVGT", iata: "VGT", city: "North Las Vegas", state: "NV", address: "2730 North Pecos Road", zip: "89030", country: "USA" },
  { name: "Harry Reid International FBO", airport: "Harry Reid International", icao: "KLAS", iata: "LAS", city: "Las Vegas", state: "NV", address: "7135 Tropicana Avenue", zip: "89119", country: "USA", aliases: ["LAS", "Las Vegas"] },
  { name: "Signature Aviation", airport: "Harry Reid International", icao: "KLAS", iata: "LAS", city: "Las Vegas", state: "NV", address: "7136 Tropicana Avenue", zip: "89119", country: "USA", aliases: ["LAS"] },

  { name: "Salt Lake City International FBO", airport: "Salt Lake City International", icao: "KSLC", iata: "SLC", city: "Salt Lake City", state: "UT", address: "776 North 600 West", zip: "84116", country: "USA", aliases: ["SLC", "Salt Lake City"] },
  { name: "Signature Aviation", airport: "Salt Lake City International", icao: "KSLC", iata: "SLC", city: "Salt Lake City", state: "UT", address: "777 North 600 West", zip: "84116", country: "USA", aliases: ["SLC"] },

  // ──────────────────────────────────────────────────────────────────────────
  // TEXAS - Comprehensive
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14001 Lakeside Drive", zip: "75254", country: "USA" },
  { name: "Atlantic Aviation", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14002 Lakeside Drive", zip: "75254", country: "USA" },
  { name: "Million Air", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14003 Lakeside Drive", zip: "75254", country: "USA" },

  { name: "Alliance Aviation", airport: "Alliance Fort Worth Airport", icao: "KAFW", iata: "AFW", city: "Fort Worth", state: "TX", address: "4050 Alliance Gateway Frwy", zip: "76177", country: "USA" },
  { name: "Signature Aviation", airport: "Alliance Fort Worth Airport", icao: "KAFW", iata: "AFW", city: "Fort Worth", state: "TX", address: "4051 Alliance Gateway Frwy", zip: "76177", country: "USA" },

  { name: "Meacham International Airport FBO", airport: "Meacham International Airport", icao: "KFTW", iata: "FTW", city: "Fort Worth", state: "TX", address: "3150 E Lancaster Avenue", zip: "76112", country: "USA" },
  { name: "Dallas Love Field FBO", airport: "Dallas Love Field", icao: "KDAL", iata: "DAL", city: "Dallas", state: "TX", address: "2700 N Lemmon Avenue", zip: "75209", country: "USA" },
  { name: "Dallas Fort Worth International FBO", airport: "Dallas Fort Worth International", icao: "KDFW", iata: "DFW", city: "Dallas", state: "TX", address: "3333 Skyway Drive", zip: "75261", country: "USA" },

  { name: "Shell Aviation", airport: "Houston Hobby Airport", icao: "KHOU", iata: "HOU", city: "Houston", state: "TX", address: "7800 Airline Drive", zip: "77017", country: "USA" },
  { name: "Houston Aeronautical Services", airport: "Houston Hobby Airport", icao: "KHOU", iata: "HOU", city: "Houston", state: "TX", address: "7934 Gulf Freeway", zip: "77017", country: "USA" },

  { name: "Signature Aviation", airport: "Sugar Land Regional Airport", icao: "KSGR", iata: "SGR", city: "Sugar Land", state: "TX", address: "350 Airport Road", zip: "77478", country: "USA" },
  { name: "Galaxy Aviation", airport: "Sugar Land Regional Airport", icao: "KSGR", iata: "SGR", city: "Sugar Land", state: "TX", address: "351 Airport Road", zip: "77478", country: "USA" },

  { name: "Signature Aviation", airport: "George Bush Intercontinental", icao: "KIAH", iata: "IAH", city: "Houston", state: "TX", address: "2100 N Terminal Road", zip: "77032", country: "USA" },
  { name: "Ellington Field FBO", airport: "Ellington Field", icao: "KEFD", iata: "EFD", city: "Houston", state: "TX", address: "11602 Aerospace Avenue", zip: "77034", country: "USA" },

  { name: "Landings at League City FBO", airport: "Galveston County Airport", icao: "KGLS", iata: "GLS", city: "League City", state: "TX", address: "4110 Runway Road", zip: "77573", country: "USA" },

  { name: "Austin Bergstrom International FBO", airport: "Austin-Bergstrom International", icao: "KAUS", iata: "AUS", city: "Austin", state: "TX", address: "3600 Presidential Blvd", zip: "78719", country: "USA" },
  { name: "Austin Executive Airport FBO", airport: "Austin Executive Airport", icao: "KXAK", iata: "XAK", city: "Austin", state: "TX", address: "3301 Runway Road", zip: "78721", country: "USA" },

  { name: "San Antonio International FBO", airport: "San Antonio International", icao: "KSAT", iata: "SAT", city: "San Antonio", state: "TX", address: "9800 Airport Blvd", zip: "78216", country: "USA" },
  { name: "San Antonio Stinson Field FBO", airport: "Stinson Field", icao: "KSSF", iata: "SSF", city: "San Antonio", state: "TX", address: "8535 South New Braunfels Avenue", zip: "78223", country: "USA" },

  { name: "Lubbock Preston Smith International FBO", airport: "Lubbock Preston Smith International", icao: "KLBB", iata: "LBB", city: "Lubbock", state: "TX", address: "5401 North Avenue Q", zip: "79403", country: "USA" },
  { name: "Amarillo Rick Husband International FBO", airport: "Rick Husband International", icao: "KAMA", iata: "AMA", city: "Amarillo", state: "TX", address: "10287 Airport Boulevard", zip: "79111", country: "USA" },
  { name: "Midland International Air and Space Port FBO", airport: "Midland International", icao: "KMAF", iata: "MAF", city: "Midland", state: "TX", address: "9600 Business Park Drive", zip: "79706", country: "USA" },
  { name: "El Paso International Airport FBO", airport: "El Paso International", icao: "KELP", iata: "ELP", city: "El Paso", state: "TX", address: "6701 Convair Road", zip: "79936", country: "USA" },
  { name: "Corpus Christi International Airport FBO", airport: "Corpus Christi International", icao: "KCRP", iata: "CRP", city: "Corpus Christi", state: "TX", address: "1000 International Boulevard", zip: "78406", country: "USA" },
  { name: "Harlingen/Rio Grande Valley International FBO", airport: "Harlingen/Rio Grande Valley", icao: "KHRL", iata: "HRL", city: "Harlingen", state: "TX", address: "100 Aircraft Lane", zip: "78550", country: "USA" },
  { name: "San Angelo Regional Airport FBO", airport: "San Angelo Regional Airport", icao: "KSJT", iata: "SJT", city: "San Angelo", state: "TX", address: "6622 Airport Boulevard", zip: "76905", country: "USA" },
  { name: "Tyler Pounds Regional Airport FBO", airport: "Tyler Pounds Regional Airport", icao: "KLTY", iata: "LTY", city: "Tyler", state: "TX", address: "550 Airport Drive", zip: "75704", country: "USA" },
  { name: "Longview International Airport FBO", airport: "Longview International", icao: "KGGG", iata: "GGG", city: "Longview", state: "TX", address: "2600 Terminal Road", zip: "75606", country: "USA" },
  { name: "Texarkana Regional Airport FBO", airport: "Texarkana Regional Airport", icao: "KTXK", iata: "TXK", city: "Texarkana", state: "TX", address: "3300 Airport Drive", zip: "75501", country: "USA" },
  { name: "Waco Regional Airport FBO", airport: "Waco Regional Airport", icao: "KACO", iata: "ACO", city: "Waco", state: "TX", address: "2110 North Avenue D", zip: "76705", country: "USA" },
  { name: "Bryan College Station Airport FBO", airport: "Easterwood Airport", icao: "KCLL", iata: "CLL", city: "College Station", state: "TX", address: "701 Texas Avenue South", zip: "77845", country: "USA" },
  { name: "Beaumont Port Arthur Regional Airport FBO", airport: "Beaumont Port Arthur Regional", icao: "KBPT", iata: "BPT", city: "Port Arthur", state: "TX", address: "303 Airport Drive", zip: "77642", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // OKLAHOMA & SOUTH CENTRAL
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Oklahoma City International FBO", airport: "Will Rogers World Airport", icao: "KOKC", iata: "OKC", city: "Oklahoma City", state: "OK", address: "7401 Air Cargo Road", zip: "73110", country: "USA", aliases: ["OKC", "Oklahoma City"] },
  { name: "Signature Aviation", airport: "Will Rogers World Airport", icao: "KOKC", iata: "OKC", city: "Oklahoma City", state: "OK", address: "7402 Air Cargo Road", zip: "73110", country: "USA", aliases: ["OKC"] },
  { name: "Million Air", airport: "Will Rogers World Airport", icao: "KOKC", iata: "OKC", city: "Oklahoma City", state: "OK", address: "7403 Air Cargo Road", zip: "73110", country: "USA", aliases: ["OKC"] },

  { name: "Tulsa International Airport FBO", airport: "Tulsa International Airport", icao: "KTUL", iata: "TUL", city: "Tulsa", state: "OK", address: "7777 E Perkins Road", zip: "74115", country: "USA", aliases: ["TUL", "Tulsa FBO"] },
  { name: "Signature Aviation", airport: "Tulsa International Airport", icao: "KTUL", iata: "TUL", city: "Tulsa", state: "OK", address: "7778 E Perkins Road", zip: "74115", country: "USA", aliases: ["TUL"] },
  { name: "Atlantic Aviation", airport: "Tulsa International Airport", icao: "KTUL", iata: "TUL", city: "Tulsa", state: "OK", address: "7779 E Perkins Road", zip: "74115", country: "USA", aliases: ["TUL"] },

  // ──────────────────────────────────────────────────────────────────────────
  // ARIZONA & SOUTHWEST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15003 N Airport Drive", zip: "85260", country: "USA" },
  { name: "Jet Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15004 N Airport Drive", zip: "85260", country: "USA" },
  { name: "Atlantic Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15005 N Airport Drive", zip: "85260", country: "USA" },

  { name: "Phoenix Deer Valley Aviation", airport: "Phoenix Deer Valley Airport", icao: "KDVT", iata: "DVT", city: "Phoenix", state: "AZ", address: "702 E Deer Valley Drive", zip: "85024", country: "USA" },
  { name: "Phoenix Sky Harbor International FBO", airport: "Phoenix Sky Harbor International", icao: "KPHX", iata: "PHX", city: "Phoenix", state: "AZ", address: "3400 S 52nd Street", zip: "85034", country: "USA" },
  { name: "Phoenix-Goodyear Airport FBO", airport: "Phoenix-Goodyear Airport", icao: "KGYR", iata: "GYR", city: "Goodyear", state: "AZ", address: "1658 S Litchfield Road", zip: "85338", country: "USA" },
  { name: "Phoenix-Mesa Gateway Airport FBO", airport: "Phoenix-Mesa Gateway", icao: "KMEZ", iata: "MEZ", city: "Mesa", state: "AZ", address: "6500 S Sossaman Road", zip: "85212", country: "USA" },
  { name: "Flagstaff Pulliam Airport FBO", airport: "Flagstaff Pulliam Airport", icao: "KFLG", iata: "FLG", city: "Flagstaff", state: "AZ", address: "6200 S Pulliam Drive", zip: "86001", country: "USA" },
  { name: "Tucson International Airport FBO", airport: "Tucson International", icao: "KTUS", iata: "TUS", city: "Tucson", state: "AZ", address: "7250 S Tucson Boulevard", zip: "85756", country: "USA" },
  { name: "Prescott Regional Airport FBO", airport: "Prescott Regional Airport", icao: "KPRC", iata: "PRC", city: "Prescott", state: "AZ", address: "900 Airport Road", zip: "86301", country: "USA" },

  { name: "Albuquerque International FBO", airport: "Albuquerque International", icao: "KABQ", iata: "ABQ", city: "Albuquerque", state: "NM", address: "2200 Sunport Boulevard", zip: "87106", country: "USA" },
  { name: "Signature Aviation", airport: "Albuquerque International", icao: "KABQ", iata: "ABQ", city: "Albuquerque", state: "NM", address: "2201 Sunport Boulevard", zip: "87106", country: "USA" },
  { name: "Santa Fe Regional Airport FBO", airport: "Santa Fe Regional Airport", icao: "KSAF", iata: "SAF", city: "Santa Fe", state: "NM", address: "288 South Airport Road", zip: "87501", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // COLORADO & MOUNTAIN WEST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Rocky Mountain Metro Airport", icao: "KBJC", iata: "BJC", city: "Broomfield", state: "CO", address: "11755 N Airport Road", zip: "80021", country: "USA" },
  { name: "Rocky Mountain Air Center", airport: "Rocky Mountain Metro Airport", icao: "KBJC", iata: "BJC", city: "Broomfield", state: "CO", address: "11756 N Airport Road", zip: "80021", country: "USA" },

  { name: "Centennial Airport FBO", airport: "Centennial Airport", icao: "KAPA", iata: "APA", city: "Littleton", state: "CO", address: "7800 S Peoria Street", zip: "80112", country: "USA" },
  { name: "Denver International Airport FBO", airport: "Denver International", icao: "KDEN", iata: "DEN", city: "Denver", state: "CO", address: "8500 Pena Boulevard", zip: "80249", country: "USA" },
  { name: "Colorado Springs Airport FBO", airport: "Colorado Springs Airport", icao: "KCOS", iata: "COS", city: "Colorado Springs", state: "CO", address: "7005 Corporate Drive", zip: "80919", country: "USA" },
  { name: "Fort Collins Airport FBO", airport: "Fort Collins-Loveland Airport", icao: "KFNL", iata: "FNL", city: "Fort Collins", state: "CO", address: "4900 Compass Drive", zip: "80525", country: "USA" },

  { name: "Aspen-Pitkin County Airport FBO", airport: "Aspen-Pitkin County Airport", icao: "KASE", iata: "ASE", city: "Aspen", state: "CO", address: "233 Airport Road", zip: "81611", country: "USA", aliases: ["ASE", "Aspen"] },
  { name: "Signature Aviation", airport: "Aspen-Pitkin County Airport", icao: "KASE", iata: "ASE", city: "Aspen", state: "CO", address: "234 Airport Road", zip: "81611", country: "USA", aliases: ["ASE"] },
  { name: "Jet Aviation", airport: "Aspen-Pitkin County Airport", icao: "KASE", iata: "ASE", city: "Aspen", state: "CO", address: "235 Airport Road", zip: "81611", country: "USA", aliases: ["ASE"] },

  { name: "Eagle Valley Regional Airport FBO", airport: "Eagle Valley Regional Airport", icao: "KEGE", iata: "EGE", city: "Eagle", state: "CO", address: "217 Longs Peak Drive", zip: "81631", country: "USA", aliases: ["EGE", "Eagle Vail"] },
  { name: "Signature Aviation", airport: "Eagle Valley Regional Airport", icao: "KEGE", iata: "EGE", city: "Eagle", state: "CO", address: "218 Longs Peak Drive", zip: "81631", country: "USA", aliases: ["EGE"] },

  { name: "Greeley/Weld County Airport FBO", airport: "Greeley/Weld County Airport", icao: "KGXY", iata: "GXY", city: "Greeley", state: "CO", address: "3500 W 47th Street", zip: "80634", country: "USA" },
  { name: "Montrose Regional Airport FBO", airport: "Montrose Regional Airport", icao: "KMTJ", iata: "MTJ", city: "Montrose", state: "CO", address: "2100 South Townsend Avenue", zip: "81401", country: "USA" },

  { name: "Jackson Hole Airport FBO", airport: "Jackson Hole Airport", icao: "KJAC", iata: "JAC", city: "Jackson", state: "WY", address: "1250 East East Road", zip: "83001", country: "USA" },
  { name: "Casper-Natrona County Airport FBO", airport: "Casper-Natrona County", icao: "KCPR", iata: "CPR", city: "Casper", state: "WY", address: "8500 Airport Parkway", zip: "82604", country: "USA" },
  { name: "Laramie Regional Airport FBO", airport: "Laramie Regional Airport", icao: "KLAR", iata: "LAR", city: "Laramie", state: "WY", address: "3800 Borie Drive", zip: "82070", country: "USA" },
  { name: "Cheyenne Regional Airport FBO", airport: "Cheyenne Regional Airport", icao: "KCYS", iata: "CYS", city: "Cheyenne", state: "WY", address: "200 East 8th Avenue", zip: "82001", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // WASHINGTON & PACIFIC NORTHWEST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Seattle-Tacoma International", icao: "KSEA", iata: "SEA", city: "SeaTac", state: "WA", address: "16110 International Blvd", zip: "98158", country: "USA" },
  { name: "Paine Field Business Aviation", airport: "Paine Field", icao: "KPAE", iata: "PAE", city: "Everett", state: "WA", address: "11900 NW Airport Drive", zip: "98204", country: "USA" },
  { name: "Boeing Field FBO", airport: "Boeing Field", icao: "KBFI", iata: "BFI", city: "Seattle", state: "WA", address: "8050 E Marginal Way S", zip: "98134", country: "USA" },
  { name: "Spokane International Airport FBO", airport: "Spokane International", icao: "KGEG", iata: "GEG", city: "Spokane", state: "WA", address: "9000 W Airport Drive", zip: "99224", country: "USA" },
  { name: "Bellingham International Airport FBO", airport: "Bellingham International", icao: "KBLI", iata: "BLI", city: "Bellingham", state: "WA", address: "4255 Mitchell Way", zip: "98226", country: "USA" },

  { name: "Portland Hillsboro Airport FBO", airport: "Portland Hillsboro Airport", icao: "KHIO", iata: "HIO", city: "Hillsboro", state: "OR", address: "3355 NE Cornell Road", zip: "97124", country: "USA" },
  { name: "Portland International Airport FBO", airport: "Portland International", icao: "KPDX", iata: "PDX", city: "Portland", state: "OR", address: "7000 NE Airport Way", zip: "97218", country: "USA" },
  { name: "Roberts Field FBO", airport: "Roberts Field", icao: "KRDM", iata: "RDM", city: "Troutdale", state: "OR", address: "23999 NE Liberator Way", zip: "97060", country: "USA" },
  { name: "Medford International Airport FBO", airport: "Medford International", icao: "KMFR", iata: "MFR", city: "Medford", state: "OR", address: "2260 Southeast Crater Lake Avenue", zip: "97504", country: "USA" },
  { name: "Eugene Airport FBO", airport: "Eugene Airport", icao: "KEUG", iata: "EUG", city: "Eugene", state: "OR", address: "30490 Boeing Drive", zip: "97402", country: "USA" },
  { name: "Salem-Leckrone Airport FBO", airport: "Salem-Leckrone Airport", icao: "KSEM", iata: "SEM", city: "Salem", state: "OR", address: "3150 Skyview Drive SE", zip: "97301", country: "USA" },

  { name: "Boise Air Terminal FBO", airport: "Boise Air Terminal", icao: "KBOI", iata: "BOI", city: "Boise", state: "ID", address: "3737 West Airport Drive", zip: "83705", country: "USA" },
  { name: "Missoula International Airport FBO", airport: "Missoula International", icao: "KMSO", iata: "MSO", city: "Missoula", state: "MT", address: "5225 Highway 93 South", zip: "59808", country: "USA" },
  { name: "Billings Logan International FBO", airport: "Billings Logan International", icao: "KBIL", iata: "BIL", city: "Billings", state: "MT", address: "2630 Terminal Road", zip: "59101", country: "USA" },
  { name: "Bozeman Gallatin Field FBO", airport: "Bozeman Gallatin Field", icao: "KBZN", iata: "BZN", city: "Bozeman", state: "MT", address: "8475 Fowler Avenue", zip: "59715", country: "USA" },
  { name: "Great Falls International FBO", airport: "Great Falls International", icao: "KGTF", iata: "GTF", city: "Great Falls", state: "MT", address: "2800 Terminal Drive", zip: "59401", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // MIDWEST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Minneapolis-St Paul International", icao: "KMSP", iata: "MSP", city: "Bloomington", state: "MN", address: "4300 Glumack Drive", zip: "55111", country: "USA" },
  { name: "Atlantic Aviation", airport: "Anoka County Airport", icao: "KANE", iata: "ANE", city: "Anoka", state: "MN", address: "2800 North Road", zip: "55303", country: "USA" },
  { name: "Minneapolis Flying Cloud Airport FBO", airport: "Flying Cloud Airport", icao: "KFCM", iata: "FCM", city: "Eden Prairie", state: "MN", address: "15400 Flying Cloud Drive", zip: "55346", country: "USA", aliases: ["FCM", "Flying Cloud"] },
  { name: "Signature Aviation", airport: "Flying Cloud Airport", icao: "KFCM", iata: "FCM", city: "Eden Prairie", state: "MN", address: "15401 Flying Cloud Drive", zip: "55346", country: "USA", aliases: ["FCM"] },

  { name: "St. Paul Downtown Airport FBO", airport: "St. Paul Downtown Airport", icao: "KSTP", iata: "STP", city: "St. Paul", state: "MN", address: "500 South Sixth Street", zip: "55106", country: "USA" },
  { name: "Duluth International Airport FBO", airport: "Duluth International", icao: "KDLH", iata: "DLH", city: "Duluth", state: "MN", address: "4701 Greysolon Road", zip: "55811", country: "USA" },
  { name: "Rochester International Airport FBO", airport: "Rochester International", icao: "KRST", iata: "RST", city: "Rochester", state: "MN", address: "6909 Congress Avenue SW", zip: "55901", country: "USA" },

  { name: "Des Moines International Airport FBO", airport: "Des Moines International", icao: "KDSM", iata: "DSM", city: "Des Moines", state: "IA", address: "5200 Fleur Drive", zip: "50321", country: "USA", aliases: ["DSM", "Des Moines"] },
  { name: "Signature Aviation", airport: "Des Moines International", icao: "KDSM", iata: "DSM", city: "Des Moines", state: "IA", address: "5201 Fleur Drive", zip: "50321", country: "USA", aliases: ["DSM"] },

  { name: "Cedar Rapids International Airport FBO", airport: "Cedar Rapids International", icao: "KCID", iata: "CID", city: "Cedar Rapids", state: "IA", address: "5100 C Avenue SW", zip: "52404", country: "USA", aliases: ["CID", "Cedar Rapids"] },
  { name: "Sioux Falls Regional Airport FBO", airport: "Sioux Falls Regional Airport", icao: "KFSD", iata: "FSD", city: "Sioux Falls", state: "SD", address: "6500 S Laguardia Street", zip: "57108", country: "USA", aliases: ["FSD", "Sioux Falls"] },
  { name: "Signature Aviation", airport: "Sioux Falls Regional Airport", icao: "KFSD", iata: "FSD", city: "Sioux Falls", state: "SD", address: "6501 S Laguardia Street", zip: "57108", country: "USA", aliases: ["FSD"] },

  { name: "Rapid City Regional Airport FBO", airport: "Rapid City Regional Airport", icao: "KRAP", iata: "RAP", city: "Rapid City", state: "SD", address: "4500 Terminal Road", zip: "57701", country: "USA", aliases: ["RAP", "Rapid City"] },
  { name: "Signature Aviation", airport: "Rapid City Regional Airport", icao: "KRAP", iata: "RAP", city: "Rapid City", state: "SD", address: "4501 Terminal Road", zip: "57701", country: "USA", aliases: ["RAP"] },

  { name: "Fargo Hector International FBO", airport: "Hector International", icao: "KFAR", iata: "FAR", city: "Fargo", state: "ND", address: "4707 19th Avenue NW", zip: "58102", country: "USA", aliases: ["FAR", "Fargo"] },
  { name: "Signature Aviation", airport: "Hector International", icao: "KFAR", iata: "FAR", city: "Fargo", state: "ND", address: "4708 19th Avenue NW", zip: "58102", country: "USA", aliases: ["FAR"] },

  { name: "Signature Aviation", airport: "DuPage Airport", icao: "KDPA", iata: "DPA", city: "West Chicago", state: "IL", address: "7200 LeaAnn Drive", zip: "60185", country: "USA" },
  { name: "Million Air", airport: "DuPage Airport", icao: "KDPA", iata: "DPA", city: "West Chicago", state: "IL", address: "7201 LeaAnn Drive", zip: "60185", country: "USA" },
  { name: "Palwaukee Aviation FBO", airport: "Palwaukee Municipal Airport", icao: "KPWK", iata: "PWK", city: "Wheeling", state: "IL", address: "1020 South Milwaukee Avenue", zip: "60090", country: "USA" },
  { name: "Chicago O'Hare International FBO", airport: "Chicago O'Hare International", icao: "KORD", iata: "ORD", city: "Chicago", state: "IL", address: "10000 W O'Hare Avenue", zip: "60666", country: "USA" },
  { name: "Chicago Midway International FBO", airport: "Chicago Midway International", icao: "KMDW", iata: "MDW", city: "Chicago", state: "IL", address: "5700 S Cicero Avenue", zip: "60638", country: "USA" },
  { name: "Waukegan Airport FBO", airport: "Waukegan Airport", icao: "KJWF", iata: "JWF", city: "Waukegan", state: "IL", address: "2700 N Des Plaines Avenue", zip: "60085", country: "USA" },
  { name: "Rockford International Airport FBO", airport: "Rockford International", icao: "KRFD", iata: "RFD", city: "Rockford", state: "IL", address: "85 National Avenue", zip: "61109", country: "USA" },
  { name: "Peoria International Airport FBO", airport: "Peoria International", icao: "KPIA", iata: "PIA", city: "Peoria", state: "IL", address: "6737 West Prospect Road", zip: "61607", country: "USA" },

  { name: "Kansas City International FBO", airport: "Kansas City International", icao: "KMCI", iata: "MCI", city: "Kansas City", state: "MO", address: "2300 North Cargo Road", zip: "64150", country: "USA" },
  { name: "Signature Aviation", airport: "Kansas City International", icao: "KMCI", iata: "MCI", city: "Kansas City", state: "MO", address: "2301 North Cargo Road", zip: "64150", country: "USA" },

  { name: "Signature Aviation", airport: "St. Louis Lambert International", icao: "KSTL", iata: "STL", city: "St. Louis", state: "MO", address: "10701 Lambert Plum Road", zip: "63145", country: "USA" },
  { name: "St. Louis Downtown Airport FBO", airport: "St. Louis Downtown Airport", icao: "KSTL", iata: "STL", city: "St. Louis", state: "MO", address: "5600 South 42nd Street", zip: "63129", country: "USA" },

  { name: "Signature Aviation", airport: "Oakland County International", icao: "KPTK", iata: "PTK", city: "Pontiac", state: "MI", address: "6500 Lapeer Road", zip: "48340", country: "USA" },
  { name: "Detroit Coleman Young International FBO", airport: "Coleman Young International", icao: "KDET", iata: "DET", city: "Detroit", state: "MI", address: "801 East Jefferson Avenue", zip: "48226", country: "USA" },
  { name: "Detroit Metropolitan Wayne County FBO", airport: "Detroit Metropolitan", icao: "KDTW", iata: "DTW", city: "Romulus", state: "MI", address: "11001 North Airport Service Drive", zip: "48242", country: "USA" },
  { name: "Flint Bishop International Airport FBO", airport: "Bishop International", icao: "KFNT", iata: "FNT", city: "Flint", state: "MI", address: "6500 West Lapeer Road", zip: "48502", country: "USA" },
  { name: "Grand Rapids International Airport FBO", airport: "Gerald R Ford International", icao: "KGRR", iata: "GRR", city: "Kentwood", state: "MI", address: "5500 East 28th Street", zip: "49512", country: "USA" },
  { name: "Kalamazoo/Battle Creek International FBO", airport: "Kalamazoo Battle Creek International", icao: "KAZO", iata: "AZO", city: "Kalamazoo", state: "MI", address: "5235 Portage Road", zip: "49002", country: "USA" },

  { name: "Indiana Airplane Airport FBO", airport: "Indiana Airplane Airport", icao: "KJNA", iata: "JNA", city: "Indianapolis", state: "IN", address: "6002 South Harding Street", zip: "46217", country: "USA" },
  { name: "Indianapolis International Airport FBO", airport: "Indianapolis International", icao: "KIND", iata: "IND", city: "Indianapolis", state: "IN", address: "7800 Col H Weir Cook Memorial Lane", zip: "46241", country: "USA" },
  { name: "Fort Wayne International Airport FBO", airport: "Fort Wayne International", icao: "KFWA", iata: "FWA", city: "Fort Wayne", state: "IN", address: "4500 East Runway Lane", zip: "46809", country: "USA" },
  { name: "South Bend Regional Airport FBO", airport: "South Bend Regional", icao: "KSBN", iata: "SBN", city: "South Bend", state: "IN", address: "5000 Lakeport Boulevard", zip: "46628", country: "USA" },

  { name: "Cincinnati/Northern Kentucky International FBO", airport: "Cincinnati/Northern Kentucky", icao: "KCVG", iata: "CVG", city: "Hebron", state: "KY", address: "2939 Terminal Drive", zip: "41048", country: "USA" },
  { name: "Burke Lakefront Airport FBO", airport: "Burke Lakefront Airport", icao: "KBKL", iata: "BKL", city: "Cleveland", state: "OH", address: "1501 North Marginal Road", zip: "44114", country: "USA" },
  { name: "Cleveland Hopkins International FBO", airport: "Cleveland Hopkins International", icao: "KCLE", iata: "CLE", city: "Cleveland", state: "OH", address: "5755 Engle Road", zip: "44130", country: "USA" },
  { name: "Columbus International Airport FBO", airport: "John Glenn Columbus International", icao: "KCOS", iata: "COS", city: "Columbus", state: "OH", address: "4600 International Gateway", zip: "43219", country: "USA" },
  { name: "Columbus Air", airport: "Don Scott Airport", icao: "KOSU", iata: "OSU", city: "Columbus", state: "OH", address: "2780 W Case Road", zip: "43235", country: "USA" },
  { name: "Akron Fulton International Airport FBO", airport: "Akron Fulton International", icao: "KAKR", iata: "AKR", city: "Akron", state: "OH", address: "5300 Lauby Road", zip: "44306", country: "USA" },
  { name: "Toledo Express Airport FBO", airport: "Toledo Express Airport", icao: "KTOL", iata: "TOL", city: "Swanton", state: "OH", address: "11111 Airport Highway", zip: "43558", country: "USA" },
  { name: "Dayton International Airport FBO", airport: "James M Cox Dayton International", icao: "KDAY", iata: "DAY", city: "Dayton", state: "OH", address: "2700 Airport Drive", zip: "45408", country: "USA", aliases: ["DAY", "Dayton FBO"] },
  { name: "Signature Aviation", airport: "James M Cox Dayton International", icao: "KDAY", iata: "DAY", city: "Dayton", state: "OH", address: "2701 Airport Drive", zip: "45408", country: "USA", aliases: ["DAY"] },

  { name: "Milwaukee Mitchell International FBO", airport: "Milwaukee Mitchell International", icao: "KMKE", iata: "MKE", city: "Milwaukee", state: "WI", address: "5300 South Howell Avenue", zip: "53207", country: "USA" },
  { name: "Madison Dane County Regional FBO", airport: "Madison Dane County", icao: "KMSN", iata: "MSN", city: "Madison", state: "WI", address: "4900 East Broadway", zip: "53716", country: "USA" },
  { name: "Green Bay Austin Straubel International FBO", airport: "Austin Straubel International", icao: "KGRB", iata: "GRB", city: "Green Bay", state: "WI", address: "2077 Airport Drive", zip: "54307", country: "USA" },

  { name: "Louisville International Airport FBO", airport: "Louisville International", icao: "KSDF", iata: "SDF", city: "Louisville", state: "KY", address: "600 Terminal Drive", zip: "40209", country: "USA" },
  { name: "Lexington Blue Grass Airport FBO", airport: "Blue Grass Airport", icao: "KLEX", iata: "LEX", city: "Lexington", state: "KY", address: "4000 Terminal Drive", zip: "40510", country: "USA", aliases: ["LEX", "Lexington"] },
  { name: "TAC Air", airport: "Blue Grass Airport", icao: "KLEX", iata: "LEX", city: "Lexington", state: "KY", address: "4001 Terminal Drive", zip: "40510", country: "USA", aliases: ["LEX"] },

  { name: "Omaha Eppley Airfield FBO", airport: "Eppley Airfield", icao: "KOFF", iata: "OFF", city: "Omaha", state: "NE", address: "4013 Congress Street", zip: "68110", country: "USA" },
  { name: "Omaha Millard Airport FBO", airport: "Millard Airport", icao: "KMLE", iata: "MLE", city: "Omaha", state: "NE", address: "15600 Millard Avenue", zip: "68154", country: "USA", aliases: ["MLE", "Millard"] },
  { name: "Signature Aviation", airport: "Millard Airport", icao: "KMLE", iata: "MLE", city: "Omaha", state: "NE", address: "15601 Millard Avenue", zip: "68154", country: "USA", aliases: ["MLE"] },

  { name: "Lincoln Airport FBO", airport: "Lincoln Airport", icao: "KLNK", iata: "LNK", city: "Lincoln", state: "NE", address: "2400 West Adams Street", zip: "68524", country: "USA" },
  { name: "Wichita Dwight D Eisenhower International FBO", airport: "Dwight D Eisenhower International", icao: "KICT", iata: "ICT", city: "Wichita", state: "KS", address: "2000 Museum Boulevard", zip: "67209", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // SOUTHEAST
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2000 Robertson Avenue", zip: "30341", country: "USA" },
  { name: "Atlantic Aviation", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2001 Robertson Avenue", zip: "30341", country: "USA" },
  { name: "Million Air", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2002 Robertson Avenue", zip: "30341", country: "USA" },

  { name: "Fulton County Airport FBO", airport: "Fulton County Airport", icao: "KFTY", iata: "FTY", city: "College Park", state: "GA", address: "3950 Aviation Avenue", zip: "30337", country: "USA" },
  { name: "Hartsfield-Jackson Atlanta International FBO", airport: "Hartsfield-Jackson Atlanta", icao: "KATL", iata: "ATL", city: "Atlanta", state: "GA", address: "6000 N Terminal Parkway", zip: "30320", country: "USA" },
  { name: "Savannah Hilton Head International FBO", airport: "Savannah Hilton Head", icao: "KSAV", iata: "SAV", city: "Savannah", state: "GA", address: "400 Airways Avenue", zip: "31408", country: "USA" },

  { name: "Tennessee Air", airport: "John C Tune Airport", icao: "KJWN", iata: "JWN", city: "Nashville", state: "TN", address: "8600 Dickerson Pike", zip: "87214", country: "USA" },
  { name: "Signature Aviation", airport: "Nashville International Airport", icao: "KBNA", iata: "BNA", city: "Nashville", state: "TN", address: "2500 Gen Tyas Boulevard", zip: "37214", country: "USA" },
  { name: "Tennessee Air National Guard", airport: "Nashville International Airport", icao: "KBNA", iata: "BNA", city: "Nashville", state: "TN", address: "2501 Gen Tyas Boulevard", zip: "37214", country: "USA" },

  { name: "Knoxville McGhee Tyson Airport FBO", airport: "McGhee Tyson Airport", icao: "KMKT", iata: "MKT", city: "Knoxville", state: "TN", address: "2055 Alcoa Highway", zip: "37920", country: "USA" },
  { name: "Chattanooga Metropolitan Airport FBO", airport: "Chattanooga Metropolitan Airport", icao: "KCHA", iata: "CHA", city: "Chattanooga", state: "TN", address: "1001 Airport Drive", zip: "37421", country: "USA", aliases: ["CHA", "Chattanooga"] },
  { name: "Wilson Air Center", airport: "Chattanooga Metropolitan Airport", icao: "KCHA", iata: "CHA", city: "Chattanooga", state: "TN", address: "1002 Airport Drive", zip: "37421", country: "USA", aliases: ["CHA"] },

  { name: "Memphis International Airport FBO", airport: "Memphis International", icao: "KMEM", iata: "MEM", city: "Memphis", state: "TN", address: "2491 Winchester Road", zip: "38116", country: "USA" },

  { name: "New Orleans Lakefront Airport FBO", airport: "New Orleans Lakefront Airport", icao: "KNEW", iata: "NEW", city: "New Orleans", state: "LA", address: "6001 Stars and Stripes Blvd", zip: "70126", country: "USA" },
  { name: "New Orleans Louis Armstrong International FBO", airport: "Louis Armstrong New Orleans International", icao: "KMSY", iata: "MSY", city: "Kenner", state: "LA", address: "900 Airline Drive", zip: "70001", country: "USA" },
  { name: "Baton Rouge Metropolitan Airport FBO", airport: "Baton Rouge Metropolitan", icao: "KBTR", iata: "BTR", city: "Baton Rouge", state: "LA", address: "1370 South Foster Drive", zip: "70806", country: "USA" },

  { name: "Little Rock National Airport FBO", airport: "Little Rock National Airport", icao: "KLIT", iata: "LIT", city: "Little Rock", state: "AR", address: "One Airport Drive", zip: "72202", country: "USA", aliases: ["LIT", "Little Rock"] },
  { name: "Signature Aviation", airport: "Little Rock National Airport", icao: "KLIT", iata: "LIT", city: "Little Rock", state: "AR", address: "Two Airport Drive", zip: "72202", country: "USA", aliases: ["LIT"] },

  { name: "Jacksonville International Airport FBO", airport: "Jacksonville International", icao: "KJAX", iata: "JAX", city: "Jacksonville", state: "FL", address: "2400 Cargo Road", zip: "32218", country: "USA" },
  { name: "Charlotte Douglas International FBO", airport: "Charlotte Douglas International", icao: "KCLT", iata: "CLT", city: "Charlotte", state: "NC", address: "5801 Wilkinson Boulevard", zip: "28208", country: "USA" },
  { name: "Raleigh-Durham International FBO", airport: "Raleigh-Durham International", icao: "KRDU", iata: "RDU", city: "Raleigh", state: "NC", address: "2600 Aerial Center Parkway", zip: "27604", country: "USA" },
  { name: "Greensboro Piedmont Triad International FBO", airport: "Piedmont Triad International", icao: "KGSO", iata: "GSO", city: "Greensboro", state: "NC", address: "6619 Bryan Boulevard", zip: "27409", country: "USA" },
  { name: "Wilmington International Airport FBO", airport: "Wilmington International", icao: "KILM", iata: "ILM", city: "Wilmington", state: "NC", address: "1740 Airport Boulevard", zip: "28405", country: "USA" },

  { name: "Asheville Regional Airport FBO", airport: "Asheville Regional Airport", icao: "KAVL", iata: "AVL", city: "Asheville", state: "NC", address: "61 Terminal Drive", zip: "28806", country: "USA", aliases: ["AVL", "Asheville"] },
  { name: "Signature Aviation", airport: "Asheville Regional Airport", icao: "KAVL", iata: "AVL", city: "Asheville", state: "NC", address: "62 Terminal Drive", zip: "28806", country: "USA", aliases: ["AVL"] },

  { name: "Columbia Metropolitan Airport FBO", airport: "Columbia Metropolitan", icao: "KCAE", iata: "CAE", city: "Columbia", state: "SC", address: "3000 Aviation Way", zip: "29208", country: "USA" },
  { name: "Charleston International Airport FBO", airport: "Charleston International", icao: "KCHS", iata: "CHS", city: "Charleston", state: "SC", address: "5500 International Boulevard", zip: "29405", country: "USA" },
  { name: "Greenville-Spartanburg International FBO", airport: "Greenville-Spartanburg", icao: "KGSP", iata: "GSP", city: "Greer", state: "SC", address: "1 Congaree Boulevard", zip: "29651", country: "USA" },

  { name: "Myrtle Beach International Airport FBO", airport: "Myrtle Beach International", icao: "KMYR", iata: "MYR", city: "Myrtle Beach", state: "SC", address: "3500 Airport Road", zip: "29577", country: "USA", aliases: ["MYR", "Myrtle Beach"] },
  { name: "Signature Aviation", airport: "Myrtle Beach International", icao: "KMYR", iata: "MYR", city: "Myrtle Beach", state: "SC", address: "3501 Airport Road", zip: "29577", country: "USA", aliases: ["MYR"] },

  { name: "Hilton Head Airport FBO", airport: "Hilton Head Airport", icao: "KHXD", iata: "HXD", city: "Hilton Head", state: "SC", address: "120 Beach City Road", zip: "29926", country: "USA", aliases: ["HXD", "Hilton Head"] },
  { name: "Signature Aviation", airport: "Hilton Head Airport", icao: "KHXD", iata: "HXD", city: "Hilton Head", state: "SC", address: "121 Beach City Road", zip: "29926", country: "USA", aliases: ["HXD"] },

  { name: "Richmond International Airport FBO", airport: "Richmond International", icao: "KRIC", iata: "RIC", city: "Richmond", state: "VA", address: "700 Richard E Byrd Terminal Drive", zip: "23218", country: "USA" },
  { name: "Roanoke-Blacksburg Regional FBO", airport: "Roanoke-Blacksburg Regional", icao: "KROA", iata: "ROA", city: "Roanoke", state: "VA", address: "5202 Aviation Drive", zip: "24012", country: "USA" },

  { name: "Birmingham International Airport FBO", airport: "Birmingham Shuttlesworth International", icao: "KBHM", iata: "BHM", city: "Birmingham", state: "AL", address: "4600 Airway Drive", zip: "35212", country: "USA", aliases: ["BHM", "Birmingham"] },
  { name: "Signature Aviation", airport: "Birmingham Shuttlesworth International", icao: "KBHM", iata: "BHM", city: "Birmingham", state: "AL", address: "4601 Airway Drive", zip: "35212", country: "USA", aliases: ["BHM"] },
  { name: "TAC Air", airport: "Birmingham Shuttlesworth International", icao: "KBHM", iata: "BHM", city: "Birmingham", state: "AL", address: "4602 Airway Drive", zip: "35212", country: "USA", aliases: ["BHM"] },

  { name: "Mobile Regional Airport FBO", airport: "Mobile Regional Airport", icao: "KMOB", iata: "MOB", city: "Mobile", state: "AL", address: "4631 World Way", zip: "36606", country: "USA", aliases: ["MOB", "Mobile"] },
  { name: "Signature Aviation", airport: "Mobile Regional Airport", icao: "KMOB", iata: "MOB", city: "Mobile", state: "AL", address: "4632 World Way", zip: "36606", country: "USA", aliases: ["MOB"] },

  { name: "Huntsville International Airport FBO", airport: "Huntsville International", icao: "KHSV", iata: "HSV", city: "Huntsville", state: "AL", address: "1000 Glenn Boulevard SW", zip: "35824", country: "USA", aliases: ["HSV", "Huntsville"] },
  { name: "Signature Aviation", airport: "Huntsville International", icao: "KHSV", iata: "HSV", city: "Huntsville", state: "AL", address: "1001 Glenn Boulevard SW", zip: "35824", country: "USA", aliases: ["HSV"] },

  // ──────────────────────────────────────────────────────────────────────────
  // MID-ATLANTIC
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Philadelphia International FBO", airport: "Philadelphia International", icao: "KPHL", iata: "PHL", city: "Philadelphia", state: "PA", address: "2400 Aviation Avenue", zip: "19153", country: "USA" },
  { name: "Allegheny County Airport FBO", airport: "Allegheny County Airport", icao: "KAGC", iata: "AGC", city: "West Mifflin", state: "PA", address: "1008 Findley Road", zip: "15122", country: "USA" },
  { name: "Pittsburgh International Airport FBO", airport: "Pittsburgh International", icao: "KPIT", iata: "PIT", city: "Pittsburgh", state: "PA", address: "1000 Airport Boulevard", zip: "23231", country: "USA" },

  { name: "Baltimore Washington International FBO", airport: "Baltimore Washington International", icao: "KBWI", iata: "BWI", city: "Linthicum", state: "MD", address: "1 W Nursery Road", zip: "21240", country: "USA" },
  { name: "Washington Dulles International FBO", airport: "Washington Dulles International", icao: "KIAD", iata: "IAD", city: "Sterling", state: "VA", address: "44420 Aviation Drive", zip: "20166", country: "USA" },
  { name: "Washington Reagan National FBO", airport: "Washington Reagan National", icao: "KDCA", iata: "DCA", city: "Washington", state: "DC", address: "Ronald Reagan Washington National", zip: "20001", country: "USA" },

  { name: "Hangar One Flight Center", airport: "Harpers Ferry Airport", icao: "KHEF", iata: "HEF", city: "Martinsburg", state: "WV", address: "1800 Aviation Road", zip: "25404", country: "USA" },
  { name: "Charleston Yeager Airport FBO", airport: "Charleston Yeager Airport", icao: "KCRW", iata: "CRW", city: "Charleston", state: "WV", address: "1900 Washington Street East", zip: "25311", country: "USA" },

  // ──────────────────────────────────────────────────────────────────────────
  // HAWAII & ALASKA
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Honolulu International Airport", icao: "PHNL", iata: "HNL", city: "Honolulu", state: "HI", address: "300 Rodgers Boulevard", zip: "96819", country: "USA", aliases: ["HNL", "Honolulu"] },
  { name: "Jet Aviation", airport: "Honolulu International Airport", icao: "PHNL", iata: "HNL", city: "Honolulu", state: "HI", address: "301 Rodgers Boulevard", zip: "96819", country: "USA", aliases: ["HNL"] },

  { name: "Signature Aviation", airport: "Kahului Airport", icao: "PHOG", iata: "OGG", city: "Kahului", state: "HI", address: "1 Kahului Airport Road", zip: "96732", country: "USA", aliases: ["OGG", "Maui"] },
  { name: "Hawaiian Airlines Kahului", airport: "Kahului Airport", icao: "PHOG", iata: "OGG", city: "Kahului", state: "HI", address: "2 Kahului Airport Road", zip: "96732", country: "USA", aliases: ["OGG"] },

  { name: "Anchorage International Airport FBO", airport: "Ted Stevens Anchorage International", icao: "PANC", iata: "ANC", city: "Anchorage", state: "AK", address: "4600 Postmark Drive", zip: "99502", country: "USA", aliases: ["ANC", "Anchorage"] },
  { name: "Northern Air Cargo", airport: "Ted Stevens Anchorage International", icao: "PANC", iata: "ANC", city: "Anchorage", state: "AK", address: "4601 Postmark Drive", zip: "99502", country: "USA", aliases: ["ANC"] },

  // ──────────────────────────────────────────────────────────────────────────
  // CANADA - Comprehensive
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Signature Aviation", airport: "Vancouver International", icao: "CYVR", iata: "YVR", city: "Richmond", state: "BC", address: "3440 Cessna Drive", zip: "V7B 1V5", country: "Canada" },
  { name: "Boundary Bay Aviation", airport: "Boundary Bay Airport", icao: "CZBB", iata: "ZBB", city: "Delta", state: "BC", address: "9080 120th Street", zip: "V4E 2A1", country: "Canada" },
  { name: "Victoria International Airport FBO", airport: "Victoria International", icao: "CYYJ", iata: "YYJ", city: "Sidney", state: "BC", address: "2200 Longspur Road", zip: "V8L 5V5", country: "Canada" },
  { name: "Kelowna International Airport FBO", airport: "Kelowna International", icao: "CYLW", iata: "YLW", city: "Kelowna", state: "BC", address: "2000 Dilworth Drive", zip: "V1Y 8N3", country: "Canada" },
  { name: "Prince George Airport FBO", airport: "Prince George Airport", icao: "CYXS", iata: "YXS", city: "Prince George", state: "BC", address: "2700 Anhurst Road", zip: "V2N 4A9", country: "Canada" },

  { name: "Signature Aviation", airport: "Calgary International", icao: "CYYC", iata: "YYC", city: "Calgary", state: "AB", address: "2000 Airport Road NE", zip: "T2E 6Z8", country: "Canada" },
  { name: "Jet Aviation", airport: "Calgary International", icao: "CYYC", iata: "YYC", city: "Calgary", state: "AB", address: "2001 Airport Road NE", zip: "T2E 6Z8", country: "Canada" },
  { name: "Edmonton International Airport FBO", airport: "Edmonton International", icao: "CYEG", iata: "YEG", city: "Edmonton", state: "AB", address: "1000 Airport Road", zip: "T5J 2R7", country: "Canada" },
  { name: "Red Deer Airport FBO", airport: "Red Deer Airport", icao: "CYQF", iata: "YQF", city: "Red Deer", state: "AB", address: "2900 Terminal Avenue", zip: "T4N 6X7", country: "Canada" },

  { name: "Saskatoon International Airport FBO", airport: "Saskatoon International", icao: "CYXE", iata: "YXE", city: "Saskatoon", state: "SK", address: "2930 Airport Drive", zip: "S7L 7L6", country: "Canada" },
  { name: "Regina International Airport FBO", airport: "Regina International", icao: "CYQR", iata: "YQR", city: "Regina", state: "SK", address: "4100 Terminal Drive", zip: "S4W 0A9", country: "Canada" },

  { name: "Winnipeg James Armstrong Richardson FBO", airport: "Winnipeg James Armstrong Richardson", icao: "CYWG", iata: "YWG", city: "Winnipeg", state: "MB", address: "45 Perimeter Road", zip: "R3H 0A8", country: "Canada" },
  { name: "Brandon Municipal Airport FBO", airport: "Brandon Municipal Airport", icao: "CYDN", iata: "YDN", city: "Brandon", state: "MB", address: "1001 Princess Avenue", zip: "R7B 1R9", country: "Canada" },

  { name: "Signature Aviation", airport: "Toronto Pearson International", icao: "CYYZ", iata: "YYZ", city: "Toronto", state: "ON", address: "675 Silver Dart Drive", zip: "M1V 3A7", country: "Canada" },
  { name: "Jet Aviation", airport: "Toronto Pearson International", icao: "CYYZ", iata: "YYZ", city: "Toronto", state: "ON", address: "676 Silver Dart Drive", zip: "M1V 3A7", country: "Canada" },

  { name: "Canadian Flight Centre", airport: "Waterloo Regional Airport", icao: "CYKF", iata: "YKF", city: "Waterloo", state: "ON", address: "235 Wilmot Avenue", zip: "N2J 4Y4", country: "Canada" },
  { name: "Hamilton Aircraft Services", airport: "Hamilton International Airport", icao: "CYHM", iata: "YHM", city: "Hamilton", state: "ON", address: "9400 Aerodrome Road", zip: "L0R 1W0", country: "Canada" },
  { name: "Ottawa International Airport FBO", airport: "Ottawa Macdonald-Cartier International", icao: "CYOW", iata: "YOW", city: "Nepean", state: "ON", address: "1000 Airport Parkway", zip: "K1V 9B4", country: "Canada" },
  { name: "London International Airport FBO", airport: "London International", icao: "CYXU", iata: "YXU", city: "London", state: "ON", address: "Fanshawe Park Road", zip: "N5W 3Z7", country: "Canada" },
  { name: "Peterborough Airport FBO", airport: "Peterborough Airport", icao: "CYPQ", iata: "YPQ", city: "Peterborough", state: "ON", address: "Airport Road", zip: "K9J 6X6", country: "Canada" },
  { name: "Toronto Buttonville Airport FBO", airport: "Buttonville Municipal Airport", icao: "CYKZ", iata: "YKZ", city: "Markham", state: "ON", address: "17 De Havilland Drive", zip: "L3R 1J3", country: "Canada" },

  { name: "Montreal Aviation Services", airport: "Saint-Hubert Airport", icao: "CYHU", iata: "YHU", city: "Saint-Hubert", state: "QC", address: "6500 Côte-de-Liesse", zip: "H4T 1H1", country: "Canada" },
  { name: "Montreal Trudeau International FBO", airport: "Montréal-Trudeau International", icao: "CYUL", iata: "YUL", city: "Montréal", state: "QC", address: "975 Avenue du Cosmodôme", zip: "H4W 1A8", country: "Canada" },
  { name: "Quebec City Jean Lesage International FBO", airport: "Jean Lesage International", icao: "CYQB", iata: "YQB", city: "Quebec City", state: "QC", address: "500 Rue de la Couture", zip: "G2G 0G3", country: "Canada" },
  { name: "Gatineau International Airport FBO", airport: "Ottawa Macdonald-Cartier/Gatineau", icao: "CYND", iata: "YND", city: "Gatineau", state: "QC", address: "1000 Airport Parkway", zip: "K1V 9B4", country: "Canada" },

  { name: "Halifax Stanfield International FBO", airport: "Halifax Stanfield International", icao: "CYHZ", iata: "YHZ", city: "Halifax", state: "NS", address: "PO Box 24010", zip: "B3J 3C4", country: "Canada" },
  { name: "Saint John Airport FBO", airport: "Saint John Airport", icao: "CYSJ", iata: "YSJ", city: "Saint John", state: "NB", address: "1 Westmorland Road", zip: "E2H 2Y7", country: "Canada" },
  { name: "Moncton International Airport FBO", airport: "Greater Moncton International", icao: "CYQM", iata: "YQM", city: "Moncton", state: "NB", address: "7170 Avenue Avenue", zip: "E1G 0G8", country: "Canada" },
  { name: "St Johns International Airport FBO", airport: "St Johns International", icao: "CYYT", iata: "YYT", city: "Saint-Jean", state: "NL", address: "200 World Ave", zip: "A1A 0B2", country: "Canada" },

  // ──────────────────────────────────────────────────────────────────────────
  // MEXICO
  // ──────────────────────────────────────────────────────────────────────────
  { name: "Cancún International FBO", airport: "Cancún International Airport", icao: "MMUN", iata: "CUN", city: "Cancún", state: "QR", address: "Carretera Cancún-Chetumal Km 22", zip: "77565", country: "Mexico", aliases: ["Cancun FBO", "CUN FBO"] },
  { name: "Mexico City International FBO", airport: "Benito Juárez International Airport", icao: "MMMX", iata: "MEX", city: "Mexico City", state: "CDMX", address: "Av. Capitán Carlos León s/n", country: "Mexico", aliases: ["MEX FBO", "CDMX FBO"] },
  { name: "Los Cabos International FBO", airport: "Los Cabos International Airport", icao: "MMSD", iata: "SJD", city: "San José del Cabo", state: "BCS", address: "Carretera Transpeninsular Km 43.5", country: "Mexico", aliases: ["Cabo FBO", "SJD FBO", "Los Cabos"] },
  { name: "Guadalajara International FBO", airport: "Miguel Hidalgo y Costilla International", icao: "MMGL", iata: "GDL", city: "Guadalajara", state: "JAL", address: "Carretera Guadalajara-Chapala Km 17.5", country: "Mexico", aliases: ["GDL FBO"] },
  { name: "Monterrey International FBO", airport: "General Mariano Escobedo International", icao: "MMMY", iata: "MTY", city: "Monterrey", state: "NL", address: "Carretera Monterrey-Zuazua Km 24", country: "Mexico", aliases: ["MTY FBO"] },
  { name: "Puerto Vallarta International FBO", airport: "Licenciado Gustavo Díaz Ordaz International", icao: "MMPR", iata: "PVR", city: "Puerto Vallarta", state: "JAL", address: "Av. Las Garzas 100", country: "Mexico", aliases: ["PVR FBO", "Vallarta FBO"] },
  { name: "Tijuana International FBO", airport: "General Abelardo L. Rodríguez International", icao: "MMTJ", iata: "TIJ", city: "Tijuana", state: "BC", address: "Blvd. Abelardo L. Rodríguez 1000", country: "Mexico", aliases: ["TIJ FBO"] },
  { name: "Hermosillo International FBO", airport: "General Ignacio Pesqueira García International", icao: "MMHO", iata: "HMO", city: "Hermosillo", state: "SON", address: "Blvd. de las Fuentes 1000", country: "Mexico", aliases: ["HMO FBO"] },
]
