Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class SiteOfficeEmulatorWindow {
 [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr window,int x,int y,int width,int height,bool repaint);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr window,int command);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
 [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
}
'@
$emulatorWindow = (Get-Process qemu-system-x86_64 -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*WinkLabz_Pixel5_API36*' } | Select-Object -First 1).MainWindowHandle
if ($emulatorWindow) {
    [void][SiteOfficeEmulatorWindow]::ShowWindow($emulatorWindow,9)
    [void][SiteOfficeEmulatorWindow]::MoveWindow($emulatorWindow,[math]::Max(20,[SiteOfficeEmulatorWindow]::GetSystemMetrics(0)-460),55,412,850,$true)
    [void][SiteOfficeEmulatorWindow]::SetForegroundWindow($emulatorWindow)
}
