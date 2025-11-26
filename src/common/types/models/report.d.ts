// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


declare namespace Models {  
  namespace Report {
    type ReportType = 'ARTICLE' | 'PLUGIN' | 'COMMUNITY' | 'USER' | 'MESSAGE';
    
    type Report = {
      id: string;
      reporterId: string;
      reason: string;
      message: string | null;
      type: ReportType;
      targetId: string;
      resolved: boolean;
      remark: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }
}
