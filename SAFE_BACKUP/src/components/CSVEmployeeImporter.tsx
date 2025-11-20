import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmployeeData {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
}

export function CSVEmployeeImporter() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<EmployeeData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload a CSV file.",
                    variant: "destructive",
                });
                // Clear the input so the user can try again
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setFile(selectedFile);
            parseCSV(selectedFile);
            setUploadSuccess(false);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');

            const data: EmployeeData[] = [];

            // Simple CSV parsing (assumes no commas in fields for this MVP)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(',').map(v => v.trim());
                if (values.length < 2) continue;

                data.push({
                    id: `temp_${i}`,
                    name: values[0] || '',
                    email: values[1] || '',
                    role: values[2] || '',
                    department: values[3] || '',
                });
            }

            setPreviewData(data.slice(0, 5)); // Preview first 5
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);

        // Simulate API call
        setTimeout(() => {
            setIsUploading(false);
            setUploadSuccess(true);
            setFile(null);
            setPreviewData([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            toast({
                title: "Import Successful",
                description: `Successfully imported employees from ${file.name}`,
            });
        }, 1500);
    };

    const clearFile = () => {
        setFile(null);
        setPreviewData([]);
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Import Employees</CardTitle>
                <CardDescription>
                    Upload a CSV file to bulk import employee data.
                    Format: Name, Email, Role, Department
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!uploadSuccess ? (
                    <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csv-upload">CSV File</Label>

                            {!file ? (
                                <Input
                                    ref={fileInputRef}
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                            ) : (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={clearFile} className="text-muted-foreground hover:text-destructive">
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </div>

                        {file && previewData.length > 0 && (
                            <div className="border rounded-md p-4 bg-slate-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="font-medium text-sm">Preview Data</span>
                                </div>

                                <div className="rounded-md border bg-white overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Department</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((employee) => (
                                                <TableRow key={employee.id}>
                                                    <TableCell>{employee.name}</TableCell>
                                                    <TableCell>{employee.email}</TableCell>
                                                    <TableCell>{employee.role}</TableCell>
                                                    <TableCell>{employee.department}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Showing first {previewData.length} rows
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="w-full sm:w-auto"
                        >
                            {isUploading ? (
                                <>
                                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Employees
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Import Complete</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Employee data has been successfully imported and queued for processing.
                            <div className="mt-4">
                                <Button variant="outline" size="sm" onClick={() => setUploadSuccess(false)} className="bg-white border-green-200 text-green-700 hover:bg-green-50">
                                    Import Another File
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
