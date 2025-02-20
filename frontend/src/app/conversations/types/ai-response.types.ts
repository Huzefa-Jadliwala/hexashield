export interface AiQueryResponse {
    acknowledgment: string;
    query: string;
    options: Option[];
}

interface Option {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    description: string;
    prerequisites?: string[];
    content?: GuideContent;
    references?: Reference[];
    script?: Script;
    dependencies?: string[];
    params?: Record<string, any>;
    vulnerabilities?: Vulnerabilities;
    output_examples?: OutputExamples;
    error_handling?: ErrorHandling;
}

interface GuideContent {
    steps: Step[];
}

interface Step {
    step: number;
    title: string;
    instructions: string;
    example?: string;
}

interface Reference {
    title: string;
    url: string;
}

interface Script {
    name: string;
    description: string;
    code: string;
}

interface Vulnerabilities {
    cves: CVE[];
    mitre: MITRE[];
}

interface CVE {
    id: string;
    severity: string;
    description: string;
    url: string;
}

interface MITRE {
    id: string;
    name: string;
    description: string;
    url: string;
}

interface OutputExamples {
    nmap: string;
    openvas: string;
}

interface ErrorHandling {
    common_issues: CommonIssue[];
}

interface CommonIssue {
    issue: string;
    solution: string;
}
