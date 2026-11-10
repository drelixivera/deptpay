export const formatClassSlug = (slug: string) => {
  const parts = slug.split('-');
  if (parts.length >= 2) {
    const deptCode = parts[0].toLowerCase();
    const level = parts[1].replace('l', ''); 
    
    // The Master Dictionary of Departments
    const deptMap: Record<string, string> = {
      'che': 'Chemical Engineering',
      'mee': 'Mechanical Engineering',
      'cve': 'Civil Engineering',
      'eee': 'Electrical/Electronics Engineering',
      'ade': 'Agricultural Engineering',
      'cpe': 'Computer Engineering',
      'fst': 'Food Science & Technology',
      // Add more LAUTECH departments here as you onboard them
    };

    const deptName = deptMap[deptCode] || deptCode.toUpperCase();
    return `${deptName} • ${level} Level`;
  }
  
  // Fallback if the URL is weird
  return 'Chemical Engineering • 300 Level';
};

export const getDepartmentName = (slug: string) => {
  const parts = slug.split('-');
  if (parts.length >= 1) {
    const deptCode = parts[0].toLowerCase();
    const deptMap: Record<string, string> = {
      'che': 'Chemical Engineering',
      'mee': 'Mechanical Engineering',
      'cve': 'Civil Engineering',
      'eee': 'Electrical/Electronics Engineering',
      'ade': 'Agricultural Engineering',
      'cpe': 'Computer Engineering',
      'fst': 'Food Science & Technology',
    };
    return deptMap[deptCode] || deptCode.toUpperCase();
  }
  return 'Chemical Engineering'; // fallback
};

export const getClassInfoForMeta = (slug: string) => {
  const parts = slug.split('-');
  if (parts.length >= 2) {
    const deptCode = parts[0].toLowerCase();
    const level = parts[1].replace('l', '');
    
    const deptMap: Record<string, string> = {
      'che': 'Chemical Engineering',
      'mee': 'Mechanical Engineering',
      'cve': 'Civil Engineering',
      'eee': 'Electrical/Electronics Engineering',
      'ade': 'Agricultural Engineering',
      'cpe': 'Computer Engineering',
      'fst': 'Food Science & Technology',
    };
    
    const deptName = deptMap[deptCode] || deptCode.toUpperCase();
    return { deptName, level };
  }
  return { deptName: 'Chemical Engineering', level: '300' };
};