@echo off
setlocal

REM Set your desired username and password
set USERNAME=cattyfatty
set PASSWORD=meowm_meow@00102099
REM Change the password above to your desired password

REM Create SSM parameters
aws ssm put-parameter ^
    --name "/catty-portal/dev/username" ^
    --value "%USERNAME%" ^
    --type "SecureString" ^
    --overwrite

aws ssm put-parameter ^
    --name "/catty-portal/dev/password" ^
    --value "%PASSWORD%" ^
    --type "SecureString" ^
    --overwrite

echo Auth parameters created successfully!
pause 