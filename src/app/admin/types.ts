// Admin 데이터 모델 정의

export interface UnresolvedIssue {
  id: string;
  title: string;
  category: string;
  priority: string;
  owner: string;
  status: string;
  blocker: string;
  dueDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  owner: string;
  status: string;
  dueDate: string;
  checked: boolean;
}

