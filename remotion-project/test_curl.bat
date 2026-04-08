curl -s -X POST https://auphonic.com/api/productions.json ^
 -H "Authorization: Bearer BbSPr9U6msK9238MSkSNWDU5vBxVqT6y" ^
 -F "action=start" ^
 -F "algorithms={\"leveler\":true,\"normloudness\":true,\"loudnesstarget\":-16,\"denoise\":true,\"denoisemethod\":\"dynamic\"}" ^
 -F "output_files=[{\"format\":\"aac\",\"bitrate\":192}]" ^
 -F "input_file=@test.wav"