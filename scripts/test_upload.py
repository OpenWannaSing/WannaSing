#!/usr/bin/env python3
import requests
import sys
import os

def test_upload(file_path, user_id=1):
    url = "http://localhost:8000/api/v1/upload"
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return None
    
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f, 'audio/mpeg')}
        data = {'user_id': user_id, 'business_type': 'performance'}
        
        response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 上传成功!")
        print(f"   audio_id: {result['data']['audio_id']}")
        print(f"   file_key: {result['data']['file_key']}")
        print(f"   duration: {result['data']['duration']}秒")
        return result['data']['audio_id']
    else:
        print(f"❌ 上传失败: {response.text}")
        return None

def test_get_audio(audio_id):
    url = f"http://localhost:8000/api/v1/audio/{audio_id}"
    response = requests.get(url)
    
    if response.status_code == 200:
        output_path = f"downloaded_{audio_id}.mp3"
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"✅ 下载成功: {output_path}")
        return output_path
    else:
        print(f"❌ 下载失败: {response.status_code}")
        return None

def test_save_performance(user_id, song_name, score, original_audio_id):
    url = "http://localhost:8000/api/v1/performance"
    data = {
        'user_id': user_id,
        'song_name': song_name,
        'score': score,
        'original_audio_id': original_audio_id
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 演唱记录保存成功!")
        print(f"   performance_id: {result['data']['performance_id']}")
        return result['data']['performance_id']
    else:
        print(f"❌ 保存失败: {response.text}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python test_upload.py <mp3文件路径>")
        sys.exit(1)
    
    audio_id = test_upload(sys.argv[1])
    
    if audio_id:
        test_get_audio(audio_id)
        test_save_performance(1, "十年", 85.5, audio_id)