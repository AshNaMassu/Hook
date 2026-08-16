using UnityEngine;

public class CameraController : MonoBehaviour
{
    public HookHero hero;
    public Transform spawnPoint;
    public float baseSpeed = 1.5f, lookahead = 2f, followLerp = 4f, killMargin = 1f;

    void Update()
    {
        float creep = transform.position.y + baseSpeed * Time.deltaTime;
        float follow = Mathf.Lerp(transform.position.y, hero.transform.position.y + lookahead,
                                  followLerp * Time.deltaTime);
        transform.position = new Vector3(0, Mathf.Max(creep, follow), -10f);

        float bottom = transform.position.y - Camera.main.orthographicSize;
        if (hero.transform.position.y < bottom - killMargin)
        {
            hero.Respawn(spawnPoint.position);
            transform.position = new Vector3(0, spawnPoint.position.y, -10f);
        }
    }
}